import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import type { GenerateAiaRequest } from '@shared/schema';

const pipelineAsync = promisify(pipeline);

interface ParsedFeatures {
  use_list_view: boolean;
  play_sound: boolean;
}

function parseRequirements(requirements: string = ''): ParsedFeatures {
  const req = requirements.toLowerCase();
  return {
    use_list_view: req.includes('list view') || req.includes('show results in list'),
    play_sound: req.includes('play sound') || req.includes('sound')
  };
}

function generateUuid(): string {
  return Math.floor(Math.random() * 1000000000).toString();
}

export async function generateAiaFile(
  request: GenerateAiaRequest,
  extensionFiles: Express.Multer.File[] = []
): Promise<Buffer> {
  const {
    projectName,
    userId,
    apiKey,
    cseId,
    searchPrompt,
    requirements = '',
  } = request;

  const features = parseRequirements(requirements);
  const tempDir = path.join(process.cwd(), 'temp', `${projectName}_${Date.now()}`);
  
  try {
    // Create directory structure
    const assetsDir = path.join(tempDir, 'assets');
    const externalCompsDir = path.join(assetsDir, 'external_comps');
    const srcDir = path.join(tempDir, 'src', 'appinventor', `ai_${userId}`, projectName);
    const youngandroidDir = path.join(tempDir, 'youngandroidproject');

    await fs.promises.mkdir(assetsDir, { recursive: true });
    await fs.promises.mkdir(externalCompsDir, { recursive: true });
    await fs.promises.mkdir(srcDir, { recursive: true });
    await fs.promises.mkdir(youngandroidDir, { recursive: true });

    // Copy extensions
    const extensionNames: string[] = [];
    for (const ext of extensionFiles) {
      const extName = path.basename(ext.originalname);
      const destPath = path.join(externalCompsDir, extName);
      await fs.promises.copyFile(ext.path, destPath);
      extensionNames.push(path.parse(extName).name);
    }

    // Generate project.properties
    const timestamp = new Date().toUTCString();
    const externalComps = extensionNames.map(name => `com.appybuilder.${name}`).join(',');
    
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

    // Generate Screen1.scm
    const components = [
      {
        "$Name": "SearchBox",
        "$Type": "TextBox",
        "$Version": "6",
        "Uuid": generateUuid(),
        "Hint": "Enter search query",
        "Text": searchPrompt,
        "Width": "Fill"
      },
      {
        "$Name": "SearchButton",
        "$Type": "Button",
        "$Version": "7",
        "Uuid": generateUuid(),
        "Text": "Search",
        "BackgroundColor": "&HFF4CAF50",
        "TextColor": "&HFFFFFFFF",
        "Width": "Fill"
      },
      {
        "$Name": "Web1",
        "$Type": "Web",
        "$Version": "6",
        "Uuid": generateUuid()
      }
    ];

    if (features.use_list_view) {
      components.push({
        "$Name": "ResultListView",
        "$Type": "ListView",
        "$Version": "8",
        "Uuid": generateUuid(),
        "Width": "Fill",
        "Height": "WrapContent"
      });
    } else {
      components.push({
        "$Name": "ResultLabel",
        "$Type": "Label",
        "$Version": "6",
        "Uuid": generateUuid(),
        "Text": "Search results will appear here",
        "FontSize": "16sp",
        "TextAlignment": "center",
        "Width": "Fill",
        "Height": "WrapContent"
      });
    }

    if (features.play_sound) {
      // Create placeholder sound file
      const soundFile = 'sample_sound.mp3';
      const soundPath = path.join(assetsDir, soundFile);
      await fs.promises.writeFile(soundPath, Buffer.from(''), 'binary');

      components.push(
        {
          "$Name": "SoundButton",
          "$Type": "Button",
          "$Version": "7",
          "Uuid": generateUuid(),
          "Text": "Play Sound",
          "BackgroundColor": "&HFFF44336",
          "TextColor": "&HFFFFFFFF",
          "Width": "Fill"
        },
        {
          "$Name": "Sound1",
          "$Type": "Sound",
          "$Version": "6",
          "Uuid": generateUuid(),
          "Source": soundFile
        }
      );
    }

    const screenScm = {
      "authURL": ["ai2.appinventor.mit.edu"],
      "YaVersion": "232",
      "Source": "Form",
      "Properties": {
        "$Name": "Screen1",
        "$Type": "Form",
        "$Version": "31",
        "ActionBar": true,
        "AppName": projectName,
        "Title": `${projectName} Search`,
        "Uuid": "0",
        "$Components": components
      }
    };

    await fs.promises.writeFile(
      path.join(srcDir, 'Screen1.scm'),
      `#|\n$JSON\n${JSON.stringify(screenScm, null, 2)}\n|#`,
      'utf-8'
    );

    // Generate Screen1.bky (Blockly blocks)
    const searchBlocks = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="component_event" x="50" y="50">
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
                <field name="TEXT">${apiKey}</field>
              </block>
            </value>
            <value name="ADD2">
              <block type="text">
                <field name="TEXT">&amp;cx=${cseId}&amp;q=</field>
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
  </block>
  
  <block type="component_event" x="50" y="300">
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
            <mutation component_type="${features.use_list_view ? 'ListView' : 'Label'}" property_name="${features.use_list_view ? 'Elements' : 'Text'}"></mutation>
            <field name="component_id">${features.use_list_view ? 'ResultListView' : 'ResultLabel'}</field>
            <field name="property_name">${features.use_list_view ? 'Elements' : 'Text'}</field>
            <value name="VALUE">
              <block type="variable_get">
                <field name="VAR">responseContent</field>
              </block>
            </value>
          </block>
        </statement>
      </block>
    </statement>
  </block>
  ${features.play_sound ? `
  <block type="component_event" x="50" y="500">
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
  </block>` : ''}
</xml>`;

    await fs.promises.writeFile(
      path.join(srcDir, 'Screen1.bky'),
      searchBlocks,
      'utf-8'
    );

    // Create ZIP archive
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const buffers: Buffer[] = [];

      archive.on('data', (chunk) => buffers.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(buffers)));
      archive.on('error', reject);

      archive.directory(tempDir, false);
      archive.finalize();
    });

  } finally {
    // Cleanup temp directory
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup temp directory:', error);
    }
  }
}
