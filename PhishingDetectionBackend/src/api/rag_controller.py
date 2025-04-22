import falcon
from utils.config import Config
from utils.decorator import Handler, Form
from service.impl.rag_service_chroma_huggingface_impl import RAGServiceChromaHuggingFaceImpl
import os


class UploadController:
    async def validate_request_type(req, resp, resource, params):
        if falcon.MEDIA_MULTIPART not in req.content_type:
            msg = 'Only multipart/form-data body is allowed'
            raise falcon.HTTPError(title='Bad request', status='400', description=msg)

    @falcon.before(validate_request_type)
    async def on_post(self, req, resp) -> None:
        @Handler.error
        async def processing_request(payload):
            form = {}
            async for part in payload:
                if('text' in part.content_type):
                    form[part.name] = await part.text
                if('application' in part.content_type):
                    form[part.name] = {'content_type': part.content_type,
                                       'filename': part.filename,
                                       'content': await part.stream.read()
                                       }
            required_keys = [
                "file"
            ]
            default_optional_keys = {}
            form = Form.validator(form, required_keys, default_optional_keys)
            if form['file']['content_type'] != "application/pdf":
                msg = 'Please input pdf in the multipart/form-data body by passing "file" as key and pdf as value'
                raise falcon.HTTPBadRequest(title='Bad request', description=msg)

            save_path = f"{os.getcwd()}/{Config.get().data.path}"
            if not os.path.exists(save_path):
                os.makedirs(save_path)
            file = form['file']['content']
            file_name = form['file']['filename']
            file_path = os.path.join(save_path, file_name)
            with open(file_path, 'wb') as f:
                f.write(file)

            res = {
            'title': 'File Uploaded',
            'status': '200',
            'description': 'File successfully uploaded.',
            'result': {'file_name': file_name,
                       'file_path': file_path}
            }
            return res
        data = await req.get_media()
        res = await processing_request(data)
        resp.media = res

class UpdateChromaDatabaseController:
    @Handler.error
    async def on_post(self, req, resp) -> None:
        form = await req.get_media()
        required_keys = [
            "file_path"
        ]
        default_optional_keys = {}
        form = Form.validator(form, required_keys, default_optional_keys)
        RAGServiceChromaHuggingFace = RAGServiceChromaHuggingFaceImpl.instance()
        RAGServiceChromaHuggingFace.add(file_path=form['file_path'])

        res = {
        'title': 'Chroma DB Updated',
        'status': '200',
        'description': 'File successfully vectorized to Chroma DB.'
        }
        resp.media = res

class BatchUpdateChromaDatabaseController:
    @Handler.error
    async def on_post(self, req, resp) -> None:    
        RAGServiceChromaHuggingFace = RAGServiceChromaHuggingFaceImpl.instance()
        RAGServiceChromaHuggingFace.add_batch()
        
        res = {
        'title': 'Chroma DB Updated',
        'status': '200',
        'description': f'All data in {Config.get().data.path} successfully vectorized to Chroma DB.'
        }
        resp.media = res

class GenerateContextFromChromaDatabaseController:
    @Handler.error
    async def on_post(self, req, resp) -> None:
        form = await req.get_media()
        required_keys = [
            "query_text"
        ]
        default_optional_keys = {
            "k": 5,
            "separator": "\n\n---\n\n"
        }
        form = Form.validator(form, required_keys, default_optional_keys)
        RAGServiceChromaHuggingFace = RAGServiceChromaHuggingFaceImpl.instance()
        generated_context = RAGServiceChromaHuggingFace.generate_context(query_text=form['query_text'],
                                                        k=form['k'],
                                                        separator=form['separator'])
        res = {
        'title': 'Context Generated',
        'status': '200',
        'description': f'Context generated with k={form["k"]} and separator={form["separator"]}.',
        'result': {
            "generated_context": generated_context
            }
        }
        resp.media = res