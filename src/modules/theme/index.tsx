import registerModule from '~/core/module';
import { UnloaderContext } from '~/core/module-loader';

import constants from '~/utils/style-constants';
import { createElement, insertCss, waitForLoad } from '~/utils/dom';

import style from './style.css';
import fontStyle from './font-style.css';

const DEFAULT_COLOR = constants.primaryMaroon;
const DEFAULT_FONT = '';

// CSS Property Utilities

function setThemeProperty(name: string, color: string) {
  document.documentElement.style.setProperty(`--gocp-theme-${name}`, color);
}

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

function setThemeColorProperty(name: string, colorObj: Color) {
  const r = colorObj.r > 255 ? 255 : colorObj.r;
  const g = colorObj.g > 255 ? 255 : colorObj.g;
  const b = colorObj.b > 255 ? 255 : colorObj.b;
  const a = colorObj.a > 1 ? 1 : colorObj.a;
  const rgba = `rgba(${r},${g},${b},${a})`;
  setThemeProperty(name, rgba);
}

// Color Utilities

function hexToRgba(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: parseInt(result[4], 16),
  };
}

function createColorObject(base: Color, r: number, g: number, b: number, a: number) {
  return {
    r: base.r + r,
    g: base.g + g,
    b: base.b + b,
    a: 0 + a,
  };
}

// Suboption Validators

// Checks if font exists on Google Fonts
async function fontValidator(font: string) {
  if (!font) {
    return { valid: true };
  }
  const endpoint = `https://fonts.googleapis.com/css?family=${font.replace(/ /g, '+')}`;
  try {
    await fetch(endpoint);
    return { valid: true };
  } catch (e) {
    return { valid: false, message: `${font} is not on Google Fonts` };
  }
}

const domQuery = () => document.querySelector('#app-style style');

async function applyColorStyles(color: string, enhanced: boolean, unloaderContext: UnloaderContext) {
  const appStyles = await waitForLoad(domQuery);

  const themeStyles = <style>{ style.toString() }</style>;
  appStyles.after(themeStyles);
  unloaderContext.addRemovable(themeStyles);

  const primaryColor = hexToRgba(color);
  const calendarColor = createColorObject(primaryColor, 0, 0, 0, 0.9);
  const topGradient = createColorObject(primaryColor, 200, 200, 200, 0.9);
  const selectedBorder = createColorObject(primaryColor, 60, 60, 60, 0.9);

  const bodyBackgroundDefault = { r: 243, g: 243, b: 243, a: 1 };
  const panelBorderDefault = { r: 205, g: 207, b: 210, a: 1 };
  const panelBodyDefault = { r: 255, g: 255, b: 255, a: 1 };

  const bodyBackground = enhanced ? createColorObject(primaryColor, 0, 0, 0, 0.15) : createColorObject(bodyBackgroundDefault, 0, 0, 0, 1);
  const panelBorder = enhanced ? createColorObject(primaryColor, 0, 0, 0, 0.4) : createColorObject(panelBorderDefault, 0, 0, 0, 1);
  const panelHead = enhanced ? createColorObject(panelBodyDefault, 0, 0, 0, 0.55) : createColorObject(panelBodyDefault, 0, 0, 0, 1);
  const panelBody = enhanced ? createColorObject(panelBodyDefault, 0, 0, 0, 0.8) : createColorObject(panelBodyDefault, 0, 0, 0, 1);

  setThemeColorProperty('primary', primaryColor);
  setThemeColorProperty('lighter', calendarColor);
  setThemeColorProperty('top-gradient', topGradient);
  setThemeColorProperty('selected-border', selectedBorder);

  setThemeColorProperty('body-background', bodyBackground);
  setThemeColorProperty('panel-border', panelBorder);
  setThemeColorProperty('panel-head', panelHead);
  setThemeColorProperty('panel-body', panelBody);
}

function applyFontStyles(font: string, unloaderContext: UnloaderContext) {
  const fontStyles = insertCss(fontStyle.toString());
  unloaderContext.addRemovable(fontStyles);

  const fontName = font.replace(/ /g, '+');
  const fontUrl = `https://fonts.googleapis.com/css?family=${fontName}`;
  const fontlink = <link href={fontUrl} rel="stylesheet" />;
  document.head.appendChild(fontlink);
  unloaderContext.addRemovable(fontlink);

  setThemeProperty('font', `"${font}", "Blackbaud Sans","Helvetica Neue",Arial,sans-serif`);
}

function themeMain(options: ThemeSuboptions, unloaderContext: UnloaderContext) {
  let { color, font, enhance } = options;

  if (color !== DEFAULT_COLOR) {
    color += 'aa';
    applyColorStyles(color, enhance, unloaderContext);
  }
  if (font !== DEFAULT_FONT) {
    applyFontStyles(font, unloaderContext);
  }

}

// empty unloader to prevent unnecessary reload if no styles were initially applied
function unloadTheme() {}

interface ThemeSuboptions {
  color: string;
  font: string;
  enhance: boolean;
}

export default registerModule('{da4e5ba5-d2da-45c1-afe5-83436e5915ec}', {
  name: 'Theme',
  init: themeMain,
  unload: unloadTheme,
  topLevelOption: true,
  suboptions: {
    color: {
      name: 'Color',
      type: 'color',
      defaultValue: DEFAULT_COLOR,
      resettable: true,
    },
    font: {
      name: 'Font',
      type: 'combo',
      description: `
        Chose a font from the list, or type in any font from 
        <a target="_blank" href="https://fonts.google.com">Google Fonts</a>. 
        Leave empty for default.
      `,
      htmlDescription: true,
      defaultValue: DEFAULT_FONT,
      presetValues: [
        DEFAULT_FONT,
        'Abel',
        'Arimo',
        'Roboto',
        'Lato',
        'Fira Sans',
        'Quicksand',
        'Josefin Sans',
        'Karla',
        'Open Sans',
      ],
      validator: fontValidator,
    },
    enhance: {
      name: 'Enhance',
      type: 'boolean',
      defaultValue: false,
    },
  },
});
