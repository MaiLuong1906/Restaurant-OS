import json
from typing import Dict, Any, Optional
from tools.backend_adapter import MockBackendAdapter, BackendPort
from tools.schemas import TOOLS_DEFINITIONS

class ToolExecutor:
    def __init__(self, adapter: Optional[BackendPort] = None):
        self.adapter = adapter or MockBackendAdapter()

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
