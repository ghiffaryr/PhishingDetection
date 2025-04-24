from typing import Optional, Dict
import os
from utils.config import Config
from loguru import logger
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, AutoModelForCausalLM, AutoConfig, GenerationConfig
from peft import PeftConfig, PeftModel
from service.model_service import ModelService
from munch import munchify
import torch

class ModelServiceImpl(ModelService):
    _instance = None

    def __init__(self):
        raise RuntimeError('Call instance() instead')

    @classmethod
    def instance(cls, 
                 model_name: str,
                 load_in_4bit: bool = False,
                 compute_dtype: torch.dtype = torch.float16):
        if cls._instance is not None:
            if model_name != cls._instance.model_name:
                # Use unload_model instead of directly deleting
                cls._instance.unload_model()
                cls._instance = None
        if cls._instance is None:
            cls._instance = cls.__new__(cls)
            cls._instance._init_instance(model_name=model_name, 
                                         load_in_4bit=load_in_4bit, 
                                         compute_dtype=compute_dtype)
        return cls._instance

    def _init_instance(self, 
                       model_name: str,
                       load_in_4bit: bool,
                       compute_dtype: torch.dtype):
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self.load_in_4bit = load_in_4bit
        self.compute_dtype = compute_dtype
        self.initialize_model(model_name)

    def initialize_model(self, 
                         model_name: str) -> None:
        model_dir = "./" + Config.get().models.path + "/" +  model_name.replace('/', '_')
        model_name = model_dir if os.path.exists(model_dir) else model_name

        config = munchify({"is_encoder_decoder": False})
        peft_config = munchify({"base_model_name_or_path": model_name})
        self.is_peft = False
        try:
            logger.info(f"Loading PEFT model configuration")
            peft_config = PeftConfig.from_pretrained(model_name, token=os.getenv("HF_TOKEN"))
            self.is_peft = True
            config = AutoConfig.from_pretrained(peft_config.base_model_name_or_path,
                                            trust_remote_code=True)
        except:
            config = AutoConfig.from_pretrained(model_name,
                                                trust_remote_code=True)
            
        model_kwargs = {
            "trust_remote_code": True,
            "token": os.getenv("HF_TOKEN"),
            "device_map": "auto"
        }

        if self.load_in_4bit:
            logger.info("Loading model with 4-bit precision")
            model_kwargs.update({
                "load_in_4bit": True,
                "torch_dtype": self.compute_dtype
            })

        if config.is_encoder_decoder:
            logger.info(f"Loading Seq2Seq model: {model_name}")
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                peft_config.base_model_name_or_path if self.is_peft else model_name, 
                **model_kwargs
            )
        else:
            logger.info(f"Loading Causal Language model: {model_name}")
            self.model = AutoModelForCausalLM.from_pretrained(
                peft_config.base_model_name_or_path if self.is_peft else model_name, 
                **model_kwargs
            )
        
        if self.is_peft:
            logger.info("Applying PEFT adapter")
            self.model = PeftModel.from_pretrained(self.model, model_name).to("cuda:0")

        self.tokenizer = AutoTokenizer.from_pretrained(peft_config.base_model_name_or_path if self.is_peft else model_name, 
                                                       trust_remote_code=True,
                                                       token=os.getenv("HF_TOKEN"))
        if not os.path.exists(model_dir):
            self.model.save_pretrained(model_dir)
            self.tokenizer.save_pretrained(model_dir)

    def generate(self,
                prompt: str,
                context: Optional[int] = "",
                max_new_tokens: Optional[int] = 200,
                temperature: Optional[float] = 1.0,
                top_k: Optional[int] = 50,
                top_p: Optional[float] = 1.0,
                repetition_penalty: Optional[float] = 1.0
                ) -> dict:
       
        prompt_template = f"""
        {context}

        Use above context if useful.

        Please respond to the following task.

        {prompt}
        """ if context else f"""
        Please respond to the following task.

        {prompt}
        """
        inputs = self.tokenizer(prompt_template, return_tensors='pt').to(device="cuda:0")
        
        # Store the prompt token length to extract only model's response later
        prompt_token_length = inputs["input_ids"].shape[1]
        
        if self.is_peft:
            output_ids = self.model.generate(input_ids=inputs["input_ids"],
                                             generation_config=GenerationConfig(max_new_tokens=max_new_tokens,
                                                                                temperature=temperature,
                                                                                top_k=top_k,
                                                                                top_p=top_p,
                                                                                repetition_penalty=repetition_penalty))
        else:
            output_ids = self.model.generate(
                input_ids=inputs["input_ids"],
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_k=top_k,
                top_p=top_p,
                repetition_penalty=repetition_penalty
            )
        
        # Get the full output first
        full_completion = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
        
        # Extract only the newly generated tokens (model's actual response)
        response_only_ids = output_ids[0][prompt_token_length:]
        completion = self.tokenizer.decode(response_only_ids, skip_special_tokens=True)
        
        # If the token-based approach strips too much, fall back to string-based trimming
        if not completion.strip():
            # Remove the prompt template using string operations
            lines = full_completion.split('\n')
            prompt_lines = prompt_template.count('\n') + 1
            completion = '\n'.join(lines[prompt_lines:]).strip()
        
        # Clean up any separator lines (like dashed lines) that might come from the model
        completion = self.clean_model_output(completion)
        
        result = {
            'completion': completion
        }

        return result
        
    def clean_model_output(self, text: str) -> str:
        """Clean up separator lines or artifacts in the model output including lines starting with < and ending with >."""
        import re
        
        lines = text.split('\n')
        cleaned_lines = []
        
        # Only apply filtering to the first 5 lines
        for i, line in enumerate(lines):
            if i < 5:
                stripped_line = line.strip()
                # Skip lines that are just dashes
                if re.match(r'^-+$', stripped_line):
                    continue
                # Skip lines that start with < and end with >
                if re.match(r'^\s*<.*>\s*$', stripped_line):
                    continue
            # Always append lines after the first 5
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def unload_model(self) -> None:
        """Unload the model from GPU to free up memory."""
        if self.model is not None:
            logger.info(f"Unloading model {self.model_name} from GPU")
            # Move model to CPU first
            self.model.to("cpu")
            # Clear CUDA cache
            torch.cuda.empty_cache()
            # Delete model and tokenizer references
            del self.model
            del self.tokenizer
            self.model = None
            self.tokenizer = None
            logger.info("Model unloaded and GPU memory cleared")