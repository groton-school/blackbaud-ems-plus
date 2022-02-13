import registerModule from '~/core/module';
import { createElement, waitForLoad } from '~/utils/dom';
import { UnloaderContext } from '~/core/module-loader';
import { changeDate, getDayViewDateString } from '~/shared/schedule';

import flatpickr from 'flatpickr';
import { BaseOptions } from 'flatpickr/dist/types/options';

const domQuery = () => document.querySelector('#col-main > div:nth-child(1)');

function datePickerInit(opts: void, unloaderContext: UnloaderContext) {
  const link = (
    <link
      rel="stylesheet"
      type="text/css"
      href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css"
    />
  );
  document.head.appendChild(link);
  unloaderContext.addRemovable(link);
}

async function datePickerMain(opts: void, unloaderContext: UnloaderContext) {
  const config: Partial<BaseOptions> = {
    async onChange([date], dateString, picker) {
      if (date.getTime() === new Date(await getDayViewDateString()).getTime()) return; // if the selected date is the date already selected
      changeDate(date);
      picker.destroy();
    },
  };

  const obs = new MutationObserver(([{ addedNodes }]) => {
    const dateText = (addedNodes[0] as HTMLElement).querySelector('.chCal-header-space + h2');
    if (dateText) {
      flatpickr(dateText, config);
    }
  });

  obs.observe(await waitForLoad(domQuery), { childList: true });

  unloaderContext.addFunction(() => obs.disconnect());
}

export default registerModule('{2e5e7964-ff75-4bd9-925a-fd7e9b024c69}', {
  name: 'Schedule Date Picker',
  description: 'Open a dialogue to pick a date in the schedule',
  init: datePickerInit,
  main: datePickerMain,
});
