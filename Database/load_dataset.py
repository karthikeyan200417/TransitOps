from datasets import load_dataset

ds = load_dataset("mindweave/vehicle-fleet-management")

print(ds)
print("\n--- First record ---")
print(ds["train"][0])
