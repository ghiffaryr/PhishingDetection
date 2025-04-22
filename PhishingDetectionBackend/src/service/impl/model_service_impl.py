from typing import Optional, Dict
import os
from utils.config import Config
from loguru import logger
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, AutoModelForCausalLM, AutoConfig, GenerationConfig
from peft import PeftConfig, PeftModel
from service.model_service import ModelService
from munch import munchify

class ModelServiceImpl(ModelService):
    _instance = None

    def __init__(self):
        raise RuntimeError('Call instance() instead')

    @classmethod
    def instance(cls, 
                 model_name: str):
        if cls._instance != None:
            if model_name != cls._instance.model_name:
                del cls._instance.model
                del cls._instance.tokenizer
                cls._instance = None
        if cls._instance is None:
            cls._instance = cls.__new__(cls)
            cls._instance._init_instance(model_name=model_name)
        return cls._instance

    def _init_instance(self, 
                       model_name: str):
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self.initialize_model(model_name)

    def initialize_model(self, 
                         model_name: str) -> None:
        model_dir = "./" + Config.get().models.path + "/" +  model_name.replace('/', '_')
        model_name = model_dir if os.path.exists(model_dir) else model_name

        # peft_config = PeftConfig.from_pretrained(model_name, token=os.getenv("HF_TOKEN"))
        # base_model = AutoModelForSeq2SeqLM.from_pretrained(peft_config.base_model_name_or_path, 
        #                                                            trust_remote_code=True,
        #                                                            token=os.getenv("HF_TOKEN"))
        # self.model = PeftModel.from_pretrained(base_model, model_name).to("cuda:0")
        # self.tokenizer = AutoTokenizer.from_pretrained(peft_config.base_model_name_or_path, 
        #                                                trust_remote_code=True,
        #                                                token=os.getenv("HF_TOKEN"))
        # self.is_peft = True
        
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
            
        if config.is_encoder_decoder:
            logger.info(f"Loading Seq2Seq model: {model_name}")
            self.model = AutoModelForSeq2SeqLM.from_pretrained(peft_config.base_model_name_or_path if self.is_peft else model_name, 
                                                                trust_remote_code=True,
                                                                token=os.getenv("HF_TOKEN")).to("cuda:0")
        else:
            logger.info(f"Loading Causal Language model: {model_name}")
            self.model = AutoModelForCausalLM.from_pretrained(peft_config.base_model_name_or_path if self.is_peft else model_name, 
                                                                trust_remote_code=True,
                                                                token=os.getenv("HF_TOKEN")).to("cuda:0")
        
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
        completion = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
        result = {
            'completion': completion
        }

        return result