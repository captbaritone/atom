/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('underscore-plus')

const ItemSpecificities = new WeakMap()

// Add an item to a menu, ensuring seprators are not duplicated.
function addItemToMenu (item, menu) {
  const lastMenuItem = _.last(menu)
  const lastMenuItemIsSpearator =
    lastMenuItem && lastMenuItem.type === 'separator'
  if (!(item.type === 'separator' && lastMenuItemIsSpearator)) {
    menu.push(item)
  }
}

export function merge (menu, item, itemSpecificity = Infinity) {
  item = cloneMenuItem(item)
  ItemSpecificities.set(item, itemSpecificity)
  const matchingItemIndex = findMatchingItemIndex(menu, item)

  if (matchingItemIndex === -1) {
    addItemToMenu(item, menu)
    return
  }

  const matchingItem = menu[matchingItemIndex]
  if (item.submenu != null) {
    for (let submenuItem of item.submenu) {
      merge(matchingItem.submenu, submenuItem, itemSpecificity)
    }
  } else if (itemSpecificity >= ItemSpecificities.get(matchingItem)) {
    menu[matchingItemIndex] = item
  }
}

export function unmerge (menu, item) {
  const matchingItemIndex = findMatchingItemIndex(menu, item)
  if (matchingItemIndex === -1) {
    return
  }

  const matchingItem = menu[matchingItemIndex]
  if (item.submenu != null) {
    for (let submenuItem of item.submenu) {
      unmerge(matchingItem.submenu, submenuItem)
    }
  }

  if (matchingItem.submenu == null || matchingItem.submenu.length === 0) {
    menu.splice(matchingItemIndex, 1)
  }
}

function findMatchingItemIndex (menu, { type, label, submenu }) {
  if (type === 'separator') {
    return -1
  }
  for (let index = 0; index < menu.length; index++) {
    const item = menu[index]
    if (
      normalizeLabel(item.label) === normalizeLabel(label) &&
      (item.submenu != null) === (submenu != null)
    ) {
      return index
    }
  }
  return -1
}

export function normalizeLabel (label) {
  if (label == null) {
    return undefined
  }
  return process.platform === 'darwin' ? label : label.replace(/&/g, '')
}

export function cloneMenuItem (item) {
  item = _.pick(
    item,
    'type',
    'label',
    'enabled',
    'visible',
    'command',
    'submenu',
    'commandDetail',
    'role',
    'accelerator'
  )
  if (item.submenu != null) {
    item.submenu = item.submenu.map(submenuItem => cloneMenuItem(submenuItem))
  }
  return item
}

// Determine the Electron accelerator for a given Atom keystroke.
//
// keystroke - The keystroke.
//
// Returns a String containing the keystroke in a format that can be interpreted
//   by Electron to provide nice icons where available.
export function acceleratorForKeystroke (keystroke) {
  if (!keystroke) {
    return null
  }
  let modifiers = keystroke.split(/-(?=.)/)
  const key = modifiers
    .pop()
    .toUpperCase()
    .replace('+', 'Plus')

  modifiers = modifiers.map(modifier =>
    modifier
      .replace(/shift/gi, 'Shift')
      .replace(/cmd/gi, 'Command')
      .replace(/ctrl/gi, 'Ctrl')
      .replace(/alt/gi, 'Alt')
  )

  const keys = [...modifiers, key]
  return keys.join('+')
}
