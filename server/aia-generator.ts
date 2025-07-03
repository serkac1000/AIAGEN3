import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import type { GenerateAiaRequest } from '@shared/schema';

function generateUuid(): string {
  return Math.floor(Math.random() * 1000000000).toString();
}

export async function generateAiaFile(
  request: GenerateAiaRequest,
  extensionFiles: Express.Multer.File[] = []
): Promise<Buffer> {
  const { projectName, userId } = request;
  const tempDir = path.join(process.cwd(), 'temp', `${projectName}_${Date.now()}`);

  try {
    // 1. Create the necessary directory structure
    const srcDir = path.join(tempDir, 'src', 'appinventor', `ai_${userId}`, projectName);
    const assetsDir = path.join(tempDir, 'assets');
    const youngandroidDir = path.join(tempDir, 'youngandroidproject');
    await fs.promises.mkdir(srcDir, { recursive: true });
    await fs.promises.mkdir(assetsDir, { recursive: true });
    await fs.promises.mkdir(youngandroidDir, { recursive: true });

    // 2. Create project.properties
    const timestamp = new Date().toUTCString();
    const externalComps = extensionFiles.map(ext => `com.appybuilder.${path.parse(ext.originalname).name}`).join(',');
    
    const projectProperties = `#
#${timestamp}
sizing=Responsive
color.primary.dark=&HFF303F9F
color.primary=&HFF3F51B5
color.accent=&HFFFF4081
aname=${projectName}
defaultfilescope=App
main=appinventor.ai_${userId}.${projectName}.Screen1
source=../src
actionbar=True
useslocation=False
assets=../assets
build=../build
name=${projectName}
showlistsasjson=True
theme=AppTheme.Light.DarkActionBar
versioncode=1
versionname=1.0
external_comps=${externalComps}
`;

    await fs.promises.writeFile(
      path.join(youngandroidDir, 'project.properties'),
      projectProperties,
      'utf-8'
    );

    // 3. Create Screen1.scm with demo components
    const components: any[] = [
      {
        "$Name": "Button1",
        "$Type": "Button",
        "$Version": "7",
        "Uuid": generateUuid(),
        "Text": "Button 1",
        "Width": "-2"
      },
      {
        "$Name": "Button2",
        "$Type": "Button",
        "$Version": "7",
        "Uuid": generateUuid(),
        "Text": "Button 2",
        "Width": "-2"
      },
      {
        "$Name": "Label1",
        "$Type": "Label",
        "$Version": "6",
        "Uuid": generateUuid(),
        "Text": "Hello from Label!",
        "Width": "-2"
      },
      {
        "$Name": "TextBox1",
        "$Type": "TextBox",
        "$Version": "6",
        "Uuid": generateUuid(),
        "Hint": "Enter text here",
        "Width": "-2"
      },
      {
        "$Name": "Image1",
        "$Type": "Image",
        "$Version": "5",
        "Uuid": generateUuid(),
        "Picture": "", // Placeholder for image asset
        "Width": "-2",
        "Height": "-2"
      },
      {
        "$Name": "CheckBox1",
        "$Type": "CheckBox",
        "$Version": "5",
        "Uuid": generateUuid(),
        "Text": "Check me!",
        "Width": "-2"
      },
      {
        "$Name": "Slider1",
        "$Type": "Slider",
        "$Version": "5",
        "Uuid": generateUuid(),
        "Width": "-2"
      },
      {
        "$Name": "Notifier1",
        "$Type": "Notifier",
        "$Version": "6",
        "Uuid": generateUuid()
      },
      {
        "$Name": "Clock1",
        "$Type": "Clock",
        "$Version": "5",
        "Uuid": generateUuid()
      },
      {
        "$Name": "Web1",
        "$Type": "Web",
        "$Version": "6",
        "Uuid": generateUuid()
      }
    ];

    const screenScm = {
      "authURL": [],
      "YaVersion": "232",
      "Source": "Form",
      "Properties": {
        "$Name": "Screen1",
        "$Type": "Form",
        "$Version": "31",
        "AppName": projectName,
        "Title": projectName,
        "Uuid": "0",
        "$Components": components
      }
    };

    await fs.promises.writeFile(
      path.join(srcDir, 'Screen1.scm'),
      `#|\n$JSON\n${JSON.stringify(screenScm, null, 2)}\n|#`,
      'utf-8'
    );

    // 4. Create Screen1.bky (blocks file)
    const screenBky = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="50" y="50">
    <mutation component_type="Button" event_name="Click" component_id="Button1"></mutation>
    <field name="component_id">Button1</field>
    <field name="event_name">Click</field>
    <statement name="DO">
      <block type="component_set_get_property">
        <mutation component_type="Form" property_name="BackgroundColor"></mutation>
        <field name="component_id">Screen1</field>
        <field name="property_name">BackgroundColor</field>
        <value name="VALUE">
          <block type="color_number">
            <field name="NUM">4278255360</field> <!-- Green -->
          </block>
        </value>
      </block>
    </statement>
  </block>
</xml>`;
    await fs.promises.writeFile(
      path.join(srcDir, 'Screen1.bky'),
      screenBky,
      'utf-8'
    );

    // 5. Create the zip archive in memory
    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const buffers: Buffer[] = [];
      archive.on('data', (chunk) => buffers.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(buffers)));
      archive.on('error', reject);
      archive.directory(tempDir, false);
      archive.finalize();
    });

    return zipBuffer;

  } finally {
    // 6. Cleanup the temporary directory
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(err => {
      console.warn(`Failed to cleanup temp directory: ${tempDir}`, err);
    });
  }
}