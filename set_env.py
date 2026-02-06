import subprocess
import sys

def set_env_var(key, value, envs=["production", "preview", "development"]):
    for env in envs:
        print(f"Setting {key} for {env}...")
        # Remove existing (ignore error)
        subprocess.run(f"vercel env rm {key} {env} -y", shell=True, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
        
        # Add new
        # We pipe the value to the command
        cmd = f"vercel env add {key} {env}"
        process = subprocess.Popen(cmd, shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate(input=value)
        
        if process.returncode != 0:
            print(f"Failed to set {key}: {stderr}")
        else:
            print(f"Successfully set {key}")

def main():
    env_vars = {}
    
    # Read .env
    print("Reading .env file...")
    try:
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
    except FileNotFoundError:
        print(".env file not found!")
        return

    # Add extra vars
    # Force API URL to be relative for same-domain requests in Vercel
    env_vars["VITE_API_URL"] = "/api" 

    print(f"Found {len(env_vars)} environment variables to uploading...")
    
    # Set them
    for key, value in env_vars.items():
        if not value:
            print(f"Skipping empty value for {key}")
            continue
        set_env_var(key, value)
    
    print("Done setting environment variables.")

if __name__ == "__main__":
    main()
