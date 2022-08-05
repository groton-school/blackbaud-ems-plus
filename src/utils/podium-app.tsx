import { createElement } from '~/utils/dom';

// script body if a function needs further parameters: ({f})(window, {params.map(s => `'${s}'`).join(',')});

// runs a function in the global scope (with the podiumApp)
export default function runWithPodiumApp(
  fn: (window: any, parameter?: string) => void,
  parameter?: string,
) {
  const script = (
    <script className="MyGrotonplus-script">
      ({fn})(window, {JSON.stringify(parameter)});
    </script>
  );
  document.head.appendChild(script); // end of head means all the podiumApp scripts run first, but they don't start initializing (in theory if MyGroton+ loaded slowly they might, so always make sure it works even if MyGroton+ loads after initializing podiumApp)
  script.remove(); // no need to clutter up the DOM with these script tags
}
