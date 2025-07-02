import os
import json
import zipfile
import shutil
from datetime import datetime
import tkinter as tk
from tkinter import messagebox, filedialog, scrolledtext

# Configuration file path in user's home directory
CONFIG_FILE = os.path.expanduser("~/aia_generator_config.json")

def load_config():
    """Load saved configuration from JSON file."""
    try:
        if os.path.exists(CONFIG_FILE):
            print(f"Loading config from {CONFIG_FILE}")
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        print("No config file found")
        return {}
    except Exception as e:
        messagebox.showwarning("Config Error", f"Failed to load config: {str(e)}")
        return {}

def save_config(user_id, api_key, cse_id):
    """Save configuration to JSON file."""
    try:
        print(f"Saving config to {CONFIG_FILE}")
        config = {"user_id": user_id, "api_key": api_key, "cse_id": cse_id}
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        messagebox.showwarning("Config Error", f"Failed to save config: {str(e)}")

def add_extensions():
    """Open file dialog to select .aix extension files."""
    files = filedialog.askopenfilenames(filetypes=[("AIX files", "*.aix")])
    if files:
        extensions.extend(list(files))
        extensions_label.config(text=f"Selected: {len(extensions)} extension(s)")
        print(f"Added extensions: {extensions}")
    return extensions

def parse_requirements(requirements):
    """Parse requirements to determine app features."""
    requirements = requirements.lower()
    features = {
        "use_list_view": "list view" in requirements or "show results in list" in requirements,
        "play_sound": "play a sound" in requirements
    }
    print(f"Parsed requirements: {features}")
    return features

def create_aia_file(project_name, user_id, api_key, cse_id, search_prompt, requirements, extensions, save_path):
    temp_dir = None
    try:
        # Validate save path
        save_dir = os.path.dirname(save_path) or os.getcwd()
        save_path = os.path.normpath(save_path)
        if not os.access(save_dir, os.W_OK):
            raise PermissionError(f"No write permission in {save_dir}")
        print(f"Save path validated: {save_path}")

        # Parse requirements
        features = parse_requirements(requirements)
        use_list_view = features["use_list_view"]
        play_sound = features["play_sound"]

        # Define project structure
        temp_dir = f"temp_{project_name}"
        assets_dir = os.path.join(temp_dir, "assets")
        external_comps_dir = os.path.join(assets_dir, "external_comps")
        src_dir = os.path.join(temp_dir, "src", "appinventor", f"ai_{user_id}", project_name)
        youngandroid_dir = os.path.join(temp_dir, "youngandroidproject")
        
        # Create directories
        print(f"Creating directories: {temp_dir}, {assets_dir}, {external_comps_dir}, {src_dir}, {youngandroid_dir}")
        os.makedirs(assets_dir, exist_ok=True)
        os.makedirs(external_comps_dir, exist_ok=True)
        os.makedirs(src_dir, exist_ok=True)
        os.makedirs(youngandroid_dir, exist_ok=True)
        
        # Copy extensions to external_comps
        extension_names = []
        for ext_path in extensions:
            if not os.path.exists(ext_path):
                raise FileNotFoundError(f"Extension file not found: {ext_path}")
            ext_name = os.path.basename(ext_path)
            dest_path = os.path.join(external_comps_dir, ext_name)
            print(f"Copying extension: {ext_path} to {dest_path}")
            with open(ext_path, "rb") as src, open(dest_path, "wb") as dst:
                dst.write(src.read())
            extension_names.append(os.path.splitext(ext_name)[0])

        # project.properties
        timestamp = datetime.utcnow().strftime("%a %b %d %H:%M:%S UTC %Y")
        external_comps = ",".join([f"com.appybuilder.{name}" for name in extension_names]) if extension_names else ""
        project_properties = f"""#
#{timestamp}
sizing=Responsive
color.primary.dark=&HFF303F9F
color.primary=&HFF3F51B5
color.accent=&HFFFF4081
aname={project_name}
defaultfilescope=App
main=appinventor.ai_{user_id}.{project_name}.Screen1
source=../src
actionbar=True
useslocation=False
assets=../assets
build=../build
name={project_name}
showlistsasjson=True
theme=AppTheme.Light.DarkActionBar
versioncode=1
versionname=1.0
external_comps={external_comps}
"""
        prop_path = os.path.join(youngandroid_dir, "project.properties")
        with open(prop_path, "w", encoding="utf-8") as f:
            f.write(project_properties)
        print(f"Created {prop_path}")

        # Screen1.scm
        components = [
            {
                "$Name": "SearchBox",
                "$Type": "TextBox",
                "$Version": "6",
                "Uuid": "-123456789",
                "Hint": "Enter search query",
                "Text": search_prompt,
                "Width": "Fill"
            },
            {
                "$Name": "SearchButton",
                "$Type": "Button",
                "$Version": "7",
                "Uuid": "-987654321",
                "Text": "Search",
                "BackgroundColor": "&HFF4CAF50",
                "TextColor": "&HFFFFFFFF",
                "Width": "Fill"
            },
            {
                "$Name": "Web1",
                "$Type": "Web",
                "$Version": "6",
                "Uuid": "-789123456"
            }
        ]
        if use_list_view:
            components.append({
                "$Name": "ResultListView",
                "$Type": "ListView",
                "$Version": "8",
                "Uuid": "-456789123",
                "Width": "Fill",
                "Height": "WrapContent"
            })
        else:
            components.append({
                "$Name": "ResultLabel",
                "$Type": "Label",
                "$Version": "6",
                "Uuid": "-456789123",
                "Text": "Search results will appear here",
                "FontSize": "16sp",
                "TextAlignment": "center",
                "Width": "Fill",
                "Height": "WrapContent"
            })
        if play_sound:
            sound_file = "sample_sound.mp3"
            sound_path = os.path.join(assets_dir, sound_file)
            with open(sound_path, "wb") as f:
                f.write(b"")  # Placeholder
            print(f"Created placeholder sound file: {sound_path}")
            components.append({
                "$Name": "SoundButton",
                "$Type": "Button",
                "$Version": "7",
                "Uuid": "-654321987",
                "Text": "Play Sound",
                "BackgroundColor": "&HFFF44336",
                "TextColor": "&HFFFFFFFF",
                "Width": "Fill"
            })
            components.append({
                "$Name": "Sound1",
                "$Type": "Sound",
                "$Version": "6",
                "Uuid": "-321987654",
                "Source": sound_file
            })
        
        screen_scm = {
            "authURL": ["ai2.appinventor.mit.edu"],
            "YaVersion": "232",
            "Source": "Form",
            "Properties": {
                "$Name": "Screen1",
                "$Type": "Form",
                "$Version": "31",
                "ActionBar": True,
                "AppName": project_name,
                "Title": f"{project_name} Search",
                "Uuid": "0",
                "$Components": components
            }
        }
        scm_path = os.path.join(src_dir, "Screen1.scm")
        with open(scm_path, "w", encoding="utf-8") as f:
            f.write(f"#|\n$JSON\n{json.dumps(screen_scm, indent=2)}\n|#")
        print(f"Created {scm_path}")

        # Screen1.bky
        blocks = [
            f"""<block type="component_event" x="50" y="50">
      <mutation component_type="Button" event_name="Click" component_id="SearchButton"></mutation>
      <field name="component_id">SearchButton</field>
      <field name="event_name">Click</field>
      <statement name="DO">
        <block type="component_method">
          <mutation component_type="Web" method_name="Url" number_of_parameters="1"></mutation>
          <field name="component_id">Web1</field>
          <field name="method_name">Url</field>
          <value name="arg0">
            <block type="text_join">
              <mutation items="4"></mutation>
              <value name="ADD0">
                <block type="text">
                  <field name="TEXT">https://www.googleapis.com/customsearch/v1?key=</field>
                </block>
              </value>
              <value name="ADD1">
                <block type="text">
                  <field name="TEXT">{api_key}</field>
                </block>
              </value>
              <value name="ADD2">
                <block type="text">
                  <field name="TEXT">&cx={cse_id}&q=</field>
                </block>
              </value>
              <value name="ADD3">
                <block type="component_get_property">
                  <mutation component_type="TextBox" property_name="Text"></mutation>
                  <field name="component_id">SearchBox</field>
                  <field name="property_name">Text</field>
                </block>
              </value>
            </block>
          </value>
          <next>
            <block type="component_method">
              <mutation component_type="Web" method_name="Get"></mutation>
              <field name="component_id">Web1</field>
              <field name="method_name">Get</field>
            </block>
          </next>
        </block>
      </statement>
    </block>"""
        ]
        
        if use_list_view:
            blocks.append(f"""<block type="component_event" x="50" y="300">
      <mutation component_type="Web" event_name="GotText" component_id="Web1"></mutation>
      <field name="component_id">Web1</field>
      <field name="event_name">GotText</field>
      <statement name="DO">
        <block type="controls_if">
          <value name="IF0">
            <block type="logic_compare">
              <field name="OP">EQ</field>
              <value name="A">
                <block type="variable_get">
                  <field name="VAR">responseCode</field>
                </block>
              </value>
              <value name="B">
                <block type="math_number">
                  <field name="NUM">200</field>
                </block>
              </value>
            </block>
          </value>
          <statement name="DO0">
            <block type="component_set_get_property">
              <mutation component_type="ListView" property_name="Elements"></mutation>
              <field name="component_id">ResultListView</field>
              <field name="property_name">Elements</field>
              <value name="VALUE">
                <block type="lists_create_with">
                  <mutation items="0"></mutation>
                  <value name="ADD0">
                    <block type="controls_forEach">
                      <field name="VAR">item</field>
                      <value name="LIST">
                        <block type="text_get_property">
                          <mutation property_name="items"></mutation>
                          <value name="DICTIONARY">
                            <block type="text_json_to_dictionary">
                              <value name="TEXT">
                                <block type="variable_get">
                                  <field name="VAR">responseContent</field>
                                </block>
                              </value>
                            </block>
                          </value>
                          <field name="PROP">items</field>
                        </block>
                      </value>
                      <statement name="DO">
                        <block type="lists_create_with">
                          <mutation items="1"></mutation>
                          <value name="ADD0">
                            <block type="text_get_property">
                              <mutation property_name="title"></mutation>
                              <value name="DICTIONARY">
                                <block type="variable_get">
                                  <field name="VAR">item</field>
                                </block>
                              </value>
                              <field name="PROP">title</field>
                            </block>
                          </value>
                        </block>
                      </statement>
                    </block>
                  </value>
                </block>
              </value>
            </block>
          </statement>
        </block>
      </statement>
    </block>""")
        else:
            blocks.append(f"""<block type="component_event" x="50" y="300">
      <mutation component_type="Web" event_name="GotText" component_id="Web1"></mutation>
      <field name="component_id">Web1</field>
      <field name="event_name">GotText</field>
      <statement name="DO">
        <block type="controls_if">
          <value name="IF0">
            <block type="logic_compare">
              <field name="OP">EQ</field>
              <value name="A">
                <block type="variable_get">
                  <field name="VAR">responseCode</field>
                </block>
              </value>
              <value name="B">
                <block type="math_number">
                  <field name="NUM">200</field>
                </block>
              </value>
            </block>
          </value>
          <statement name="DO0">
            <block type="component_set_get_property">
              <mutation component_type="Label" property_name="Text"></mutation>
              <field name="component_id">ResultLabel</field>
              <field name="property_name">Text</field>
              <value name="VALUE">
                <block type="text_join">
                  <mutation items="2"></mutation>
                  <value name="ADD0">
                    <block type="text_get_property">
                      <mutation property_name="title"></mutation>
                      <value name="DICTIONARY">
                        <block type="text_json_to_dictionary">
                          <value name="TEXT">
                            <block type="variable_get">
                              <field name="VAR">responseContent</field>
                            </block>
                          </value>
                        </block>
                      </value>
                      <field name="PROP">title</field>
                    </block>
                  </value>
                  <value name="ADD1">
                    <block type="text">
                      <field name="TEXT"></field>
                    </block>
                  </value>
                </block>
              </value>
            </block>
          </statement>
        </block>
      </statement>
    </block>""")
        
        if play_sound:
            blocks.append(f"""<block type="component_event" x="50" y="600">
      <mutation component_type="Button" event_name="Click" component_id="SoundButton"></mutation>
      <field name="component_id">SoundButton</field>
      <field name="event_name">Click</field>
      <statement name="DO">
        <block type="component_method">
          <mutation component_type="Sound" method_name="Play"></mutation>
          <field name="component_id">Sound1</field>
          <field name="method_name">Play</field>
        </block>
      </statement>
    </block>""")
        
        screen_bky = f"""<xml xmlns="http://www.w3.org/1999/xhtml">
  <yacodeblocks ya-version="232" language-version="31">
    {"".join(blocks)}
  </yacodeblocks>
</xml>"""
        bky_path = os.path.join(src_dir, "Screen1.bky")
        with open(bky_path, "w", encoding="utf-8") as f:
            f.write(screen_bky)
        print(f"Created {bky_path}")

        # Verify all files exist
        required_files = [prop_path, scm_path, bky_path]
        for ext_name in extension_names:
            required_files.append(os.path.join(external_comps_dir, f"{ext_name}.aix"))
        if play_sound:
            required_files.append(os.path.join(assets_dir, "sample_sound.mp3"))
        for file_path in required_files:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Required file missing: {file_path}")

        # Create .aia file
        print(f"Zipping files to {save_path}")
        with zipfile.ZipFile(save_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.normpath(os.path.join(project_name, os.path.relpath(file_path, temp_dir)))
                    zf.write(file_path, arcname)
                    print(f"Added to zip: {file_path} -> {arcname}")
        
        # Verify .aia file
        if not os.path.exists(save_path) or os.path.getsize(save_path) == 0:
            raise RuntimeError(f".aia file not created or empty: {save_path}")
        
        # Save configuration
        save_config(user_id, api_key, cse_id)
        messagebox.showinfo("Success", f"Created {save_path}")
        print(f"Successfully created {save_path}")
    except Exception as e:
        messagebox.showerror("Error", f"Failed to create .aia file: {str(e)}")
        print(f"Error: {str(e)}")
        raise
    finally:
        if temp_dir and os.path.exists(temp_dir):
            print(f"Cleaning up temporary directory: {temp_dir}")
            shutil.rmtree(temp_dir, ignore_errors=True)

def validate_inputs():
    project_name = project_name_entry.get().strip()
    user_id = user_id_entry.get().strip()
    api_key = api_key_entry.get().strip()
    cse_id = cse_id_entry.get().strip()
    search_prompt = prompt_entry.get().strip()
    requirements = requirements_text.get("1.0", tk.END).strip()
    
    if not project_name or not user_id or not api_key or not cse_id or not search_prompt:
        messagebox.showwarning("Input Error", "All fields except requirements are required!")
        return False
    if not project_name.isalnum():
        messagebox.showwarning("Input Error", "Project name must contain only letters and numbers!")
        return False
    print(f"Validated inputs: project_name={project_name}, user_id={user_id}, search_prompt={search_prompt}, requirements={requirements}")
    return project_name, user_id, api_key, cse_id, search_prompt, requirements

def on_generate():
    inputs = validate_inputs()
    if inputs:
        project_name, user_id, api_key, cse_id, search_prompt, requirements = inputs
        save_path = filedialog.asksaveasfilename(defaultextension=".aia", filetypes=[("AIA files", "*.aia")])
        if save_path:
            print(f"Selected save path: {save_path}")
            create_aia_file(project_name, user_id, api_key, cse_id, search_prompt, requirements, extensions, save_path)

# Create GUI
root = tk.Tk()
root.title("MIT App Inventor AIA Generator")
root.geometry("500x600")

# Load saved configuration
config = load_config()
extensions = []

# Labels and Entries
tk.Label(root, text="Project Name (e.g., SearchApp):").pack(pady=5)
project_name_entry = tk.Entry(root)
project_name_entry.pack()

tk.Label(root, text="MIT App Inventor User ID (e.g., serkac100):").pack(pady=5)
user_id_entry = tk.Entry(root)
user_id_entry.insert(0, config.get("user_id", ""))
user_id_entry.pack()

tk.Label(root, text="Google API Key:").pack(pady=5)
api_key_entry = tk.Entry(root)
api_key_entry.insert(0, config.get("api_key", ""))
api_key_entry.pack()

tk.Label(root, text="Custom Search Engine ID:").pack(pady=5)
cse_id_entry = tk.Entry(root)
cse_id_entry.insert(0, config.get("cse_id", ""))
cse_id_entry.pack()

tk.Label(root, text="Search Prompt (e.g., AI news):").pack(pady=5)
prompt_entry = tk.Entry(root)
prompt_entry.pack()

tk.Label(root, text="Functional Requirements (e.g., play a sound, list view):").pack(pady=5)
requirements_text = scrolledtext.ScrolledText(root, height=5, wrap=tk.WORD)
requirements_text.pack()

tk.Label(root, text="Extensions (.aix files):").pack(pady=5)
extensions_label = tk.Label(root, text="No extensions selected")
extensions_label.pack()
tk.Button(root, text="Add Extensions", command=add_extensions).pack()

# Generate Button
tk.Button(root, text="Generate AIA File", command=on_generate).pack(pady=20)

root.mainloop()