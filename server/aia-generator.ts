import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import type { GenerateAiaRequest } from '@shared/schema';
import os from 'os';

function generateUuid(): string {
  return Math.floor(Math.random() * 1000000000).toString();
}

export async function generateAiaFile(
  request: GenerateAiaRequest,
  files: any = {}
): Promise<Buffer> {
  const extensionFiles = files?.extensions || [];
  const designImageFiles = files?.designImages || [];
  const { projectName, userId } = request;
  // Use OS temp directory for better cross-platform compatibility
  const tempDir = path.join(os.tmpdir(), 'aia-generator', `${projectName}_${Date.now()}`);

  console.log(`[AIA_GEN] Starting generation for project: ${projectName}`);
  console.log(`[AIA_GEN] Extension files: ${extensionFiles.length}`);
  console.log(`[AIA_GEN] Design images: ${designImageFiles.length}`);
  console.log(`[AIA_GEN] Requirements: "${request.requirements || 'none'}"`);
  console.log(`[AIA_GEN] Search prompt: "${request.searchPrompt || 'none'}"`);

  try {
    // 1. Create the necessary directory structure
    const srcDir = path.join(tempDir, 'src', 'appinventor', `ai_${userId}`, projectName);
    const assetsDir = path.join(tempDir, 'assets');
    const youngandroidDir = path.join(tempDir, 'youngandroidproject');

    console.log(`[AIA_GEN] Creating directories in: ${tempDir}`);
    await fs.promises.mkdir(srcDir, { recursive: true });
    await fs.promises.mkdir(assetsDir, { recursive: true });
    await fs.promises.mkdir(youngandroidDir, { recursive: true });
    console.log(`[AIA_GEN] Directories created successfully`);

    // 2. Create project.properties
    const timestamp = new Date().toUTCString();
    const externalComps = extensionFiles.map((ext: any) => `com.appybuilder.${path.parse(ext.originalname).name}`).join(',');

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
      { encoding: 'utf-8' }
    );

    // 3. Create Screen1.scm with user-specified components
    const requirements = request.requirements || "";
    const searchPrompt = request.searchPrompt || "default search";

    // Parse requirements to determine components needed
    const reqLower = requirements.toLowerCase();
    const components: any[] = [];

    // Always add basic components
    components.push(
      {
        "$Name": "Label1",
        "$Type": "Label",
        "$Version": "6",
        "Uuid": generateUuid(),
        "Text": `Welcome to ${projectName}`,
        "Width": "-2",
        "FontSize": "18"
      }
    );

    // Parse number of buttons from requirements - both natural language and pseudo-code
    let buttonCount = 0;
    const buttonMatches = reqLower.match(/(\d+)\s*buttons?/);
    const wordMatches = reqLower.match(/(one|two|three|four|five|six|seven|eight|nine|ten)\s*buttons?/);
    
    // Check for pseudo-code button references (Button1, Button2, etc.)
    const pseudoCodeButtons = reqLower.match(/button(\d+)/g);
    if (pseudoCodeButtons) {
      const buttonNumbers = pseudoCodeButtons.map(btn => parseInt(btn.replace('button', ''), 10));
      buttonCount = Math.max(...buttonNumbers);
    }
    
    if (buttonMatches && !buttonCount) {
      buttonCount = parseInt(buttonMatches[1], 10);
    } else if (wordMatches && !buttonCount) {
      const wordToNumber = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      buttonCount = wordToNumber[wordMatches[1] as keyof typeof wordToNumber] || 0;
    }

    console.log(`[AIA_GEN] Detected button count: ${buttonCount}`);

    if (buttonCount > 0 && buttonCount <= 10) {
      for (let i = 1; i <= buttonCount; i++) {
        components.push({
          "$Name": `Button${i}`,
          "$Type": "Button",
          "$Version": "7",
          "Uuid": generateUuid(),
          "Text": `Button ${i}`,
          "Width": "-2",
          "Height": "-2"
        });
      }
    } else {
      // Default buttons
      components.push(
        {
          "$Name": "SearchButton",
          "$Type": "Button",
          "$Version": "7",
          "Uuid": generateUuid(),
          "Text": "Search",
          "Width": "-2"
        },
        {
          "$Name": "ClearButton",
          "$Type": "Button",
          "$Version": "7",
          "Uuid": generateUuid(),
          "Text": "Clear",
          "Width": "-2"
        }
      );
    }

    // Add search components
    components.push(
      {
        "$Name": "SearchBox",
        "$Type": "TextBox",
        "$Version": "6",
        "Uuid": generateUuid(),
        "Hint": searchPrompt,
        "Width": "-2"
      },
      {
        "$Name": "ResultsLabel",
        "$Type": "Label",
        "$Version": "6",
        "Uuid": generateUuid(),
        "Text": "Search results will appear here",
        "Width": "-2"
      }
    );

    // Add list view if requested
    if (reqLower.includes('list view') || reqLower.includes('list')) {
      components.push({
        "$Name": "ResultsList",
        "$Type": "ListView",
        "$Version": "5",
        "Uuid": generateUuid(),
        "Width": "-2",
        "Height": "300"
      });
    }

    // Add text boxes if requested
    const textboxMatches = reqLower.match(/(\d+)\s*text\s*box(es)?/);
    if (textboxMatches || reqLower.includes('text box') || reqLower.includes('input')) {
      const textboxCount = textboxMatches ? parseInt(textboxMatches[1], 10) : 1;
      for (let i = 1; i <= Math.min(textboxCount, 5); i++) {
        components.push({
          "$Name": `TextBox${i}`,
          "$Type": "TextBox",
          "$Version": "6",
          "Uuid": generateUuid(),
          "Hint": `Enter text ${i}`,
          "Width": "-2"
        });
      }
    }

    // Add labels if requested
    const labelMatches = reqLower.match(/(\d+)\s*label(s)?/);
    if (labelMatches) {
      const labelCount = parseInt(labelMatches[1], 10);
      for (let i = 2; i <= Math.min(labelCount + 1, 6); i++) { // Start from 2 since Label1 already exists
        components.push({
          "$Name": `Label${i}`,
          "$Type": "Label",
          "$Version": "6",
          "Uuid": generateUuid(),
          "Text": `Label ${i}`,
          "Width": "-2"
        });
      }
    }

    // Add sound player if requested
    if (reqLower.includes('sound') || reqLower.includes('play')) {
      components.push({
        "$Name": "SoundPlayer",
        "$Type": "Player",
        "$Version": "6",
        "Uuid": generateUuid()
      });
    }

    // Add image components if requested and images are provided
    if ((reqLower.includes('gui via image') || reqLower.includes('image') || reqLower.includes('picture')) && designImageFiles && designImageFiles.length > 0) {
      designImageFiles.forEach((imageFile: any, index: number) => {
        components.push({
          "$Name": `Image${index + 1}`,
          "$Type": "Image",
          "$Version": "4",
          "Uuid": generateUuid(),
          "Picture": imageFile.originalname,
          "Width": "-2",
          "Height": "200"
        });
      });
    }

    // Add web component for API calls
    components.push(
      {
        "$Name": "WebComponent",
        "$Type": "Web",
        "$Version": "6",
        "Uuid": generateUuid()
      },
      {
        "$Name": "Notifier1",
        "$Type": "Notifier",
        "$Version": "6",
        "Uuid": generateUuid()
      }
    );

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
      { encoding: 'utf-8' }
    );

    // 4. Create Screen1.bky (blocks file) - MIT AI2 exact specification
    let blockEvents = '';
    let blockId = 1;

    // Parse specific actions from requirements - handle both natural language and pseudo-code
    const parseButtonActions = (requirements: string) => {
      const actions: { [key: number]: string[] } = {};
      const req = requirements.toLowerCase();
      
      // Look for pseudo-code patterns using string matching for better compatibility
      const lines = req.split('\n');
      lines.forEach(line => {
        // Pattern: On Button1.Click do ... Set Screen1.BackgroundColor to Red
        if (line.includes('on button') && line.includes('click') && line.includes('set') && line.includes('backgroundcolor')) {
          const buttonMatch = line.match(/button(\d+)/);
          const colorMatch = line.match(/backgroundcolor\s+to\s+(\w+)/);
          if (buttonMatch && colorMatch) {
            const buttonNum = parseInt(buttonMatch[1], 10);
            const color = colorMatch[1];
            if (!actions[buttonNum]) actions[buttonNum] = [];
            actions[buttonNum].push(`set_background_${color}`);
          }
        }
        
        // Pattern: When Button1 is clicked ... Set Screen1.BackgroundColor to Red
        if (line.includes('when button') && line.includes('clicked') && line.includes('set') && line.includes('backgroundcolor')) {
          const buttonMatch = line.match(/button(\d+)/);
          const colorMatch = line.match(/backgroundcolor\s+to\s+(\w+)/);
          if (buttonMatch && colorMatch) {
            const buttonNum = parseInt(buttonMatch[1], 10);
            const color = colorMatch[1];
            if (!actions[buttonNum]) actions[buttonNum] = [];
            actions[buttonNum].push(`set_background_${color}`);
          }
        }
      });
      
      // Also check the entire requirements for Set Screen.BackgroundColor patterns
      const setBgMatches = req.match(/set\s+screen\d*\.backgroundcolor\s+to\s+(\w+)/g);
      if (setBgMatches) {
        setBgMatches.forEach(match => {
          const colorMatch = match.match(/to\s+(\w+)/);
          if (colorMatch) {
            const color = colorMatch[1];
            // Find which button this action belongs to by looking at context
            const beforeMatch = req.substring(0, req.indexOf(match));
            const buttonMatch = beforeMatch.match(/button(\d+)(?!.*button\d+)/);
            if (buttonMatch) {
              const buttonNum = parseInt(buttonMatch[1], 10);
              if (!actions[buttonNum]) actions[buttonNum] = [];
              if (!actions[buttonNum].includes(`set_background_${color}`)) {
                actions[buttonNum].push(`set_background_${color}`);
              }
            }
          }
        });
      }
      
      // Also look for natural language patterns
      const naturalLanguagePatterns = [
        /button\s*(\d+).*?set\s+(\w+)\s+background/g,
        /push\s+(?:on\s+)?button\s*(\d+).*?set\s+(\w+)\s+background/g,
        /click\s+button\s*(\d+).*?set\s+(\w+)\s+background/g
      ];
      
      naturalLanguagePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(req)) !== null) {
          const buttonNum = parseInt(match[1], 10);
          const color = match[2];
          if (!actions[buttonNum]) actions[buttonNum] = [];
          if (!actions[buttonNum].includes(`set_background_${color}`)) {
            actions[buttonNum].push(`set_background_${color}`);
          }
        }
      });
      
      return actions;
    };

    const buttonActions = parseButtonActions(requirements);
    console.log(`[AIA_GEN] Detected button actions: ${JSON.stringify(buttonActions)}`);

    // Generate blocks based on components
    if (buttonCount > 0) {
      // Create button click events for the detected number of buttons
      for (let i = 1; i <= buttonCount; i++) {
        const hasSpecificAction = buttonActions[i] && buttonActions[i].length > 0;
        
        blockEvents += `
    <block type="component_event" id="${blockId}" x="50" y="${50 + (i-1) * 150}">
      <mutation component_type="Button" is_generic="false" instance_name="Button${i}" event_name="Click"></mutation>
      <field name="component_object">Button${i}</field>
      <statement name="DO">`;

        if (hasSpecificAction && buttonActions[i].some(action => action.startsWith('set_background_'))) {
          // Get the color from the action
          const colorAction = buttonActions[i].find(action => action.startsWith('set_background_'));
          const color = colorAction?.split('_')[2] || 'blue';
          
          // Generate proper MIT App Inventor color value
          const colorValues: { [key: string]: string } = {
            'red': '&HFFFF0000',
            'green': '&HFF00FF00', 
            'blue': '&HFF0000FF',
            'yellow': '&HFFFFFF00',
            'white': '&HFFFFFFFF',
            'black': '&HFF000000',
            'orange': '&HFFFFA500',
            'purple': '&HFF800080'
          };
          
          const colorValue = colorValues[color] || '&HFF0000FF';
          
          blockEvents += `
        <block type="component_set_get" id="${blockId + 1}">
          <mutation component_type="Form" set_or_get="set" property_name="BackgroundColor" is_generic="false" instance_name="Screen1"></mutation>
          <field name="PROP">BackgroundColor</field>
          <value name="VALUE">
            <block type="color_make_color" id="${blockId + 2}">
              <value name="COLORLIST">
                <block type="lists_create_with" id="${blockId + 3}">
                  <mutation items="3"></mutation>
                  <value name="ADD0">
                    <block type="math_number" id="${blockId + 4}">
                      <field name="NUM">${parseInt(colorValue.slice(4, 6), 16)}</field>
                    </block>
                  </value>
                  <value name="ADD1">
                    <block type="math_number" id="${blockId + 5}">
                      <field name="NUM">${parseInt(colorValue.slice(6, 8), 16)}</field>
                    </block>
                  </value>
                  <value name="ADD2">
                    <block type="math_number" id="${blockId + 6}">
                      <field name="NUM">${parseInt(colorValue.slice(8, 10), 16)}</field>
                    </block>
                  </value>
                </block>
              </value>
            </block>
          </value>
        </block>`;
        blockId += 6;
        } else {
          // Default action - update label
          blockEvents += `
        <block type="component_set_get" id="${blockId + 1}">
          <mutation component_type="Label" set_or_get="set" property_name="Text" is_generic="false" instance_name="Label1"></mutation>
          <field name="PROP">Text</field>
          <value name="VALUE">
            <block type="text" id="${blockId + 2}">
              <field name="TEXT">Button ${i} clicked! ${searchPrompt || projectName}</field>
            </block>
          </value>
        </block>`;
          blockId += 3;
        }

        blockEvents += `
      </statement>
    </block>`;
        
        // Adjust blockId based on whether we used the complex color blocks or simple text
        if (hasSpecificAction && buttonActions[i].some(action => action.startsWith('set_background_'))) {
          blockId += 0; // Already incremented by 6 above
        }
      }
    } else {
      // Default search and clear button events
      blockEvents += `
    <block type="component_event" id="1" x="50" y="50">
      <mutation component_type="Button" is_generic="false" instance_name="SearchButton" event_name="Click"></mutation>
      <field name="component_object">SearchButton</field>
      <statement name="DO">
        <block type="component_set_get" id="2">
          <mutation component_type="Label" set_or_get="set" property_name="Text" is_generic="false" instance_name="ResultsLabel"></mutation>
          <field name="PROP">Text</field>
          <value name="VALUE">
            <block type="text" id="3">
              <field name="TEXT">Searching for: ${searchPrompt}</field>
            </block>
          </value>
        </block>
      </statement>
    </block>
    <block type="component_event" id="4" x="50" y="200">
      <mutation component_type="Button" is_generic="false" instance_name="ClearButton" event_name="Click"></mutation>
      <field name="component_object">ClearButton</field>
      <statement name="DO">
        <block type="component_set_get" id="5">
          <mutation component_type="TextBox" set_or_get="set" property_name="Text" is_generic="false" instance_name="SearchBox"></mutation>
          <field name="PROP">Text</field>
          <value name="VALUE">
            <block type="text" id="6">
              <field name="TEXT"></field>
            </block>
          </value>
        </block>
      </statement>
    </block>`;
    }

    const screenBky = `<xml xmlns="https://developers.google.com/blockly/xml">
  <yacodeblocks ya-version="232" language-version="31">${blockEvents}
  </yacodeblocks>
</xml>`;
    await fs.promises.writeFile(
      path.join(srcDir, 'Screen1.bky'),
      screenBky,
      { encoding: 'utf-8' }
    );

    // 5. Save design images to assets folder if provided
    if (designImageFiles && designImageFiles.length > 0) {
      for (const imageFile of designImageFiles) {
        const imagePath = path.join(assetsDir, imageFile.originalname);
        await fs.promises.copyFile(imageFile.path, imagePath);
        // Clean up temp file
        await fs.promises.unlink(imageFile.path).catch(() => {});
      }
    }

    // 6. Create the zip archive in memory
    console.log(`[AIA_GEN] Creating ZIP archive from: ${tempDir}`);
    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const buffers: Buffer[] = [];

      archive.on('data', (chunk) => buffers.push(chunk));
      archive.on('end', () => {
        console.log(`[AIA_GEN] ZIP archive created successfully`);
        resolve(Buffer.concat(buffers));
      });
      archive.on('error', (err) => {
        console.error(`[AIA_GEN] ZIP creation error:`, err);
        reject(err);
      });
      archive.on('warning', (err) => {
        console.warn(`[AIA_GEN] ZIP warning:`, err);
      });

      archive.directory(tempDir, false);
      archive.finalize();
    });

    return zipBuffer;

  } catch (error) {
    console.error(`[AIA_GEN] Generation failed:`, error);
    throw new Error(`AIA generation failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // 7. Cleanup the temporary directory
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
      console.log(`[AIA_GEN] Cleaned up temp directory: ${tempDir}`);
    } catch (err) {
      console.warn(`[AIA_GEN] Failed to cleanup temp directory: ${tempDir}`, err);
    }
  }
}