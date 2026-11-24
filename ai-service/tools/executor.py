import json
from typing import Dict, Any, Optional
from config import get_settings
from tools.backend_adapter import MockBackendAdapter, BackendPort
from tools.real_backend_adapter import RealBackendAdapter
from tools.schemas import TOOLS_DEFINITIONS

class ToolExecutor:
    def __init__(self, adapter: Optional[BackendPort] = None):
        if adapter is not None:
            self.adapter = adapter
        else:
            settings = get_settings()
            if settings.backend_mode == "real":
                self.adapter = RealBackendAdapter()
            else:
                self.adapter = MockBackendAdapter()

    def execute(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        fn = getattr(self.adapter, tool_name, None)
        if not fn:
            return {"status": "error", "message": f"Tool '{tool_name}' not implemented"}
        try:
            return fn(**arguments)
        except TypeError as te:
            return {"status": "error", "message": f"Invalid arguments for '{tool_name}': {str(te)}"}
        except Exception as e:
            return {"status": "error", "message": f"Error executing '{tool_name}': {str(e)}"}
