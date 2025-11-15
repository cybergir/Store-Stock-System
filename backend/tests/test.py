from sqlalchemy.ext.asyncio import create_async_engine
import asyncio

async def test_db():
    DATABASE_URL = "sqlite+aiosqlite:///./test.db"
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Database connection successful!")
    
    await engine.dispose()

asyncio.run(test_db())