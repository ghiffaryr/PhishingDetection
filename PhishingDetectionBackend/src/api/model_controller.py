import falcon
from utils.decorator import Handler, Form
from service.impl.model_service_impl import ModelServiceImpl

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
            "repetition_penalty": 1.0
        }
        form = Form.validator(form, required_keys, default_optional_keys)

        ModelService = ModelServiceImpl.instance(model_name=form['model_name'])
        result = ModelService.generate(prompt=form["prompt"],
                                        context=form["context"],
                                        max_new_tokens=form["max_new_tokens"],
                                        temperature=form["temperature"],
                                        top_k=form["top_k"],
                                        top_p=form["top_p"],
                                        repetition_penalty=form["repetition_penalty"])

        res = {
            'title': 'Generation Result',
            'status': "200",
            'description': 'Prompt has successfully analyzed',
            'result': result
        }
        resp.media = res