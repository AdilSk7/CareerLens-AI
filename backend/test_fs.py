import os
import sys

# Add backend directory to sys path so we can import firebase_admin normally
backend_dir = r"e:\mama laptop backup\CareerLens AI\backend"
sys.path.insert(0, backend_dir)

import firebase_admin
from firebase_admin import credentials, firestore as admin_firestore

cred_path = os.path.join(backend_dir, "firebase-service-account.json")
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = admin_firestore.client()
docs = db.collection("resumes").stream()

with open("fs_output.txt", "w", encoding="utf-8") as f:
    for doc in docs:
        f.write(f"Doc ID: {doc.id} => {doc.to_dict()}\n")
