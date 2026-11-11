import httpx
import asyncio
from datetime import datetime
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

FLOW_API = "http://localhost:8000"
app = Server("flow")

@app.list_tools()
async def list_tools():
    return [
        Tool(
            name="save_insight",
            description="Claude 대화를 FLOW에 저장해요",
            inputSchema={
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "answer": {"type": "string"},
                    "token": {"type": "string"}
                },
                "required": ["question", "answer", "token"]
            }
        ),
        Tool(
            name="get_insights",
            description="FLOW 인사이트 조회",
            inputSchema={
                "type": "object",
                "properties": {
                    "token": {"type": "string"}
                },
                "required": ["token"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "save_insight":
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{FLOW_API}/",
                    headers={"Authorization": f"Bearer {arguments['token']}"},
                    json={
                        "ai_source": "Claude",
                        "question": arguments["question"],
                        "answer": arguments["answer"],
                        "collected_at": datetime.utcnow().isoformat(),
                    }
                )
            msg = "✅ 저장됐어요!" if response.status_code == 201 else f"❌ 실패: {response.status_code}"
            return [TextContent(type="text", text=msg)]
        except Exception as e:
            return [TextContent(type="text", text=f"❌ 에러: {str(e)}")]

    elif name == "get_insights":
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{FLOW_API}/",
                    headers={"Authorization": f"Bearer {arguments['token']}"}
                )
            if response.status_code == 200:
                insights = response.json().get("insights", [])
                if not insights:
                    return [TextContent(type="text", text="저장된 인사이트가 없어요")]
                result = f"📚 총 {len(insights)}개\n\n"
                for i, item in enumerate(insights[:5], 1):
                    result += f"{i}. {item.get('q_summary', '')}\n"
                    result += f"   → {item.get('a_summary', '')}\n\n"
                return [TextContent(type="text", text=result)]
            return [TextContent(type="text", text=f"❌ 실패: {response.status_code}")]
        except Exception as e:
            return [TextContent(type="text", text=f"❌ 에러: {str(e)}")]

async def main():
    async with stdio_server() as (read, write):
        await app.run(read, write, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())