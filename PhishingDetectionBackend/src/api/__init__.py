from typing import Dict
from api.status_controller import (
    StatusController,
    GPUCheckController
)
from api.rag_controller import (
    UploadController,
    UpdateChromaDatabaseController,
    BatchUpdateChromaDatabaseController,
    GenerateContextFromChromaDatabaseController
)
from api.model_controller import (
    GenerateModelController
)
ROUTES: Dict[str, any] = {
    "/status": StatusController,
    "/file/upload": UploadController,
    "/chroma/update": UpdateChromaDatabaseController,
    "/chroma/batch_update": BatchUpdateChromaDatabaseController,
    "/rag/generate_context": GenerateContextFromChromaDatabaseController,
    "/model/generate": GenerateModelController,
    "/gpu_check": GPUCheckController,
 }