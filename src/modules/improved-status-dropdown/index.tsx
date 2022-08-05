import registerModule from '~/core/module';
import { UnloaderContext } from '~/core/module-loader';

import { waitForLoad, insertCss, createElement, waitForOne } from '~/utils/dom';
import {
  addAssignmentTableMutationObserver,
  isTask,
  getAssignmentRows,
} from '~/shared/assignments-center';

// import party from 'party-js';

import style from './style.css';

const selectors = {
  inlined: style.locals.inlined,
};

const sparkleChance = 1 / 12;
let showConfetti: boolean;

function getOverdueFromRow(row: HTMLElement) {
  return !!row.querySelector('[data-overdue="true"]');
}

function getStatusButtonFromRow(row: HTMLElement) {
  return !!row.querySelector('.assignment-status-update');
}

class StatusDropdown {

  private assignmentRow: HTMLElement;
  private statusElement: HTMLElement;
  private status: string;
  private task: boolean;
  private overdue: boolean;

  private select: HTMLSelectElement;

  constructor(assignmentRow: HTMLElement) {
    this.assignmentRow = assignmentRow;
    this.statusElement = this.getStatusElement();
    this.status = this.statusElement.textContent;
    this.overdue = getOverdueFromRow(assignmentRow);
    this.task = isTask(assignmentRow);
    this.select = this.createSelect();
  }

  private getStatusElement() {
    return this.assignmentRow.querySelector('[data-heading="Status"] .label') as HTMLElement;
  }

  getSelectElement() {
    return this.select;
  }

  remove() {
    this.select.remove();
  }

  private createSelect() {
    const options = this.createOptionElements();

    const select = (
      <select
        onChange={() => this.handleSelectChange()}
        className="form-control"
      >
        { options }
      </select>
    );

    return select as HTMLSelectElement;
  }

  // Refresh select with new options, based on new status
  private refreshSelect() {
    const options = this.createOptionElements();
    this.select.innerHTML = ''; // remove all children
    this.select.append(...options);
  }

  private createOptionElements() {
    const optionNames = ['To Do', 'In\u00a0Progress', 'Completed'];

    if (this.overdue) {
      optionNames.splice(0, 1); // Cannot set to "Todo" if status is overdue
      if (this.status !== 'Overdue') {
        // only remove current status if assignment is overdue, but not set as "Overdue"
        optionNames.splice(optionNames.indexOf(this.status), 1);
      }
    } else {
      optionNames.splice(optionNames.indexOf(this.status), 1); // remove current status
    }

    const options = [
      this.createOptionElement('-- Select --', 'select'),
      this.createOptionElement(optionNames[0], '1'),
    ];

    if (optionNames[1]) {
      options.push(this.createOptionElement(optionNames[1], '2'));
    }
    if (this.task) {
      options.push(this.createOptionElement('Edit Task', 'edit-task'));
    }

    return options;
  }

  private createOptionElement(name: string, value: string) {
    return <option value={value}>{name}</option>;
  }

  private showConfetti() {
    if (!showConfetti) return;
    const random = Math.random();
    console.log('Pretend confetti just appeared.');
    /*
    FIXME party-js won't compile
    if (random < sparkleChance) {
      party.sparkles(this.statusElement);
    } else {
      party.confetti(this.statusElement);
    }
    */
  }

  handleSelectChange() {
    const { value: newValue } = this.select;

    if (newValue === 'select') { // "-- Select --"
      return;
    } else if (newValue === 'edit-task') {
      this.simulateEditClick();
      this.select.selectedIndex = 0;
      return;
    }
    this.status = this.select.options[this.select.selectedIndex].textContent;
    if (this.status === 'Completed') this.showConfetti();
    this.refreshSelect();
    this.simulateDropdownChange(Number(newValue));
  }

  // Click on real (hidden) edit link
  async simulateEditClick() {
    this.getHiddenChangeStatusButton().click();
    const editLink = await waitForLoad(() => (
      this.assignmentRow.querySelector('[data-value="edit-user-task"]') as HTMLElement
    ));
    editLink.click();
  }

  // Change real (hidden) dropdown
  async simulateDropdownChange(index: number) {
    this.getHiddenChangeStatusButton().click();
    const elem = await waitForLoad(() => (
      this.assignmentRow
        .querySelector('.assignment-status-dropdown') as HTMLSelectElement
    ));
    elem.selectedIndex = index;
    elem.dispatchEvent(new Event('change'));
  }

  // Get real/native MyGann change button
  private getHiddenChangeStatusButton() {
    return this.assignmentRow.querySelector('.assignment-status-update') as HTMLElement;
  }

}

function insertChangeStatusDropdowns(unloaderContext: UnloaderContext) {
  const assignmentRows = getAssignmentRows();

  for (const row of assignmentRows) {
    if (!getStatusButtonFromRow(row as HTMLElement)) continue; // the new dropdown relies on the old dropdown button, if it doesn't exist skip the assignment
    const dropdown = new StatusDropdown(row as HTMLElement);

    const changeStatusColumn = row.querySelector('td:last-child');
    changeStatusColumn.append(dropdown.getSelectElement());
    row.classList.add(selectors.inlined);

    unloaderContext.addRemovable(dropdown);
  }
}

async function improvedStatusDropdownMain(
  opts: ImprovedStatusSuboptions,
  unloaderContext: UnloaderContext,
) {
  showConfetti = opts.showConfetti;
  const styles = insertCss(style.toString());
  unloaderContext.addRemovable(styles);

  await waitForOne(getAssignmentRows);
  insertChangeStatusDropdowns(unloaderContext);

  const observer = await addAssignmentTableMutationObserver(() => {
    insertChangeStatusDropdowns(unloaderContext);
  });
  unloaderContext.addRemovable(observer);
}

interface ImprovedStatusSuboptions {
  showConfetti: boolean;
}

export default registerModule('{4155f319-a10b-4e4e-8a10-999a43ef9d19}', {
  name: 'Improved Status Dropdown',
  description: 'Show status dropdown directly in assignment, without having to click on "Change Status" link. Also, confetti.', // eslint-disable-line max-len
  main: improvedStatusDropdownMain,
  suboptions: {
    showConfetti: {
      name: 'Sparkles and Confetti',
      type: 'boolean',
      defaultValue: true,
    },
  },
});
