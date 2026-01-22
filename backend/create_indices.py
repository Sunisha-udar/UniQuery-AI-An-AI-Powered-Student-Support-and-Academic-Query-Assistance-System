from app.services.qdrant_service import get_qdrant_service

qdrant = get_qdrant_service()

print("Creating indices...")
try:
    # Keyword indices
    for field in ["program", "department", "category", "title", "doc_id"]:
        try:
            qdrant.client.create_payload_index(
                collection_name=qdrant.collection_name,
                field_name=field,
                field_schema="keyword"
            )
            print(f"✓ Created keyword index for {field}")
        except Exception as e:
            print(f"  {field}: {str(e)[:50]}")
    
    # Integer indices
    for field in ["semester", "version", "page"]:
        try:
            qdrant.client.create_payload_index(
                collection_name=qdrant.collection_name,
                field_name=field,
                field_schema="integer"
            )
            print(f"✓ Created integer index for {field}")
        except Exception as e:
            print(f"  {field}: {str(e)[:50]}")
    
    print("\nIndices created successfully!")
except Exception as e:
    print(f"Error: {e}")
