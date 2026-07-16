from typing import Optional
import structlog

logger = structlog.get_logger()

_prisma = None


def get_prisma():
    global _prisma
    if _prisma is None:
        try:
            from prisma import Prisma
            _prisma = Prisma()
            logger.info("prisma_client_initialized")
        except ImportError:
            logger.warning("prisma not available, using mock")
            _prisma = MockPrisma()
    return _prisma


class MockPrisma:
    """Mock minimal para pruebas sin Prisma instalado"""

    class models:
        class chatsession:
            @staticmethod
            async def create(**kwargs):
                return MockObject(id="mock-session-id", **{k: v for k, v in kwargs.get("data", {}).items() if k != "data"})

            @staticmethod
            async def find_first(**kwargs):
                return None

            @staticmethod
            async def find_many(**kwargs):
                return []

            @staticmethod
            async def update(**kwargs):
                return MockObject(id=kwargs.get("where", {}).get("id", "mock"))

            @staticmethod
            async def update_many(**kwargs):
                return 0

        class chatmessage:
            @staticmethod
            async def create(**kwargs):
                return MockObject(id="mock-msg-id", **{k: v for k, v in kwargs.get("data", {}).items() if k != "data"})

            @staticmethod
            async def find_many(**kwargs):
                return []

        chatsession = chatsession()
        chatmessage = chatmessage()

    chatsession = models.chatsession()
    chatmessage = models.chatmessage()


class MockObject:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def dict(self):
        return self.__dict__
