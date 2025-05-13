from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

# Database configuration
DATABASE_URI = 'postgresql://postgres:naman@localhost:5432/backup'  # Update the password

def test_db_connection():
    try:
        # Create a new SQLAlchemy engine
        engine = create_engine(DATABASE_URI)
        
        # Try to connect to the database
        with engine.connect() as connection:
            print("Connection to the database was successful!")
        
    except OperationalError as e:
        print(f"Failed to connect to the database: {e}")

if __name__ == "__main__":
    test_db_connection()
