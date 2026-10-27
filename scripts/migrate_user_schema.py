import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password=os.environ["DB_PASSWORD"],
    port=3306,
    database="medinsight_ai",
    autocommit=True
)
cur = conn.cursor()

try:
    cur.execute("ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN','RESEARCHER','STUDENT','STAFF','CITIZEN') NOT NULL DEFAULT 'STUDENT'")
    print("[OK] Altered role ENUM to include STAFF and CITIZEN")
except Exception as e:
    print("[NOTICE] Role ENUM alteration:", e)

cols = [
    ("department", "VARCHAR(255) NULL"),
    ("degree_branch", "VARCHAR(255) NULL"),
    ("address", "VARCHAR(500) NULL"),
    ("country", "VARCHAR(100) NULL"),
    ("identification_number", "VARCHAR(25) NULL"),
    ("pending_password_hash", "VARCHAR(255) NULL"),
    ("pending_password_requested_at", "DATETIME NULL")
]

for col_name, col_def in cols:
    try:
        cur.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
        print(f"[OK] Added column {col_name}")
    except Exception as e:
        print(f"[NOTICE] Column {col_name}: {e}")

cur.execute("DESCRIBE users")
cols_now = [r[0] for r in cur.fetchall()]
print("[CURRENT COLUMNS]:", cols_now)
cur.close()
conn.close()
