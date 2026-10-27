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
    cur.execute("ALTER TABLE users MODIFY COLUMN role ENUM('CEO','ADMIN','RESEARCHER','STUDENT','STAFF','CITIZEN') NOT NULL DEFAULT 'STUDENT'")
    print("[OK] Altered role ENUM to include CEO")
except Exception as e:
    print("[NOTICE] Role ENUM alteration:", e)

# Add platform_settings table if needed for CEO max admin configuration
try:
    cur.execute("""
    CREATE TABLE IF NOT EXISTS platform_governance (
        id INT PRIMARY KEY AUTO_INCREMENT,
        max_admins INT NOT NULL DEFAULT 5,
        updated_by INT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    """)
    cur.execute("SELECT id FROM platform_governance WHERE id = 1")
    if not cur.fetchone():
        cur.execute("INSERT INTO platform_governance (id, max_admins) VALUES (1, 5)")
    print("[OK] Platform governance table verified")
except Exception as e:
    print("[NOTICE] Governance table:", e)

cur.close()
conn.close()
