import falcon
from utils.decorator import Handler, Form
from service.impl.model_service_impl import ModelServiceImpl
import torch

class GenerateModelController:
    @Handler.error
    async def on_post(self, req, resp) -> None:
        form = await req.get_media()
        required_keys = ["model_name", "prompt"]
        default_optional_keys = {
            "context": "",
            "max_new_tokens": 200,
            "temperature": 1.0,
            "top_k": 50,
            "top_p": 1.0,
            "repetition_penalty": 1.0,
            "load_in_4bit": True,
            "compute_dtype": "bfloat16"
        }
        form = Form.validator(form, required_keys, default_optional_keys)

        # Map for compute_dtype strings to torch data types
        dtype_map = {
            "float32": torch.float32,
            "float16": torch.float16,
            "bfloat16": torch.bfloat16,
            "int8": torch.int8,
            "int16": torch.int16,
            "int32": torch.int32,
            "int64": torch.int64
        }

        # Convert compute_dtype string to torch dtype
        compute_dtype = dtype_map.get(form["compute_dtype"], torch.bfloat16)  # Default to torch.bfloat16

        ModelService = ModelServiceImpl.instance(
            model_name=form['model_name'],
            load_in_4bit=form["load_in_4bit"],
            compute_dtype=compute_dtype
        )
        result = ModelService.generate(
            prompt=form["prompt"],
            context=form["context"],
            max_new_tokens=form["max_new_tokens"],
            temperature=form["temperature"],
            top_k=form["top_k"],
            top_p=form["top_p"],
            repetition_penalty=form["repetition_penalty"]
        )

        res = {
            'title': 'Generation Result',
            'status': "200",
            'description': 'Prompt has successfully analyzed',
            'result': result
        }
        resp.media = res