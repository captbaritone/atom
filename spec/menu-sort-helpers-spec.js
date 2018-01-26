const {sortMenuItems} = require('../src/menu-sort-helpers')

describe('contextMenu', () => {
  describe('dedupes separators', () => {
    it('preserves existing submenus', () => {
      const items = [{ submenu: [] }]
      expect(sortMenuItems(items)).toEqual(items)
    })
  })
  describe('dedupes separators', () => {
    it('trims leading separators', () => {
      const items = [{ type: 'separator' }, { command: 'core:one' }]
      const expected = [{ command: 'core:one' }]
      expect(sortMenuItems(items)).toEqual(expected)
    })
    it('preserves separators at the begining of set two', () => {
      const items = [
        { command: 'core:one' },
        { type: 'separator' }, { command: 'core:two' }
      ]
      const expected = [
        { command: 'core:one' },
        { type: 'separator' },
        { command: 'core:two' }
      ]
      expect(sortMenuItems(items)).toEqual(expected)
    })
    it('trims trailing separators', () => {
      const items = [{ command: 'core:one' }, { type: 'separator' }]
      const expected = [{ command: 'core:one' }]
      expect(sortMenuItems(items)).toEqual(expected)
    })
    it('removes duplicate separators across sets', () => {
      const items = [
        { command: 'core:one' }, { type: 'separator' },
        { type: 'separator' }, { command: 'core:two' }
      ]
      const expected = [
        { command: 'core:one' },
        { type: 'separator' },
        { command: 'core:two' }
      ]
      expect(sortMenuItems(items)).toEqual(expected)
    })
  })
  describe('can move an item to a different group by merging groups', () => {
    it('can move a group of one item', () => {
      const items = [
        { command: 'core:one' },
        { type: 'separator' },
        { command: 'core:two' },
        { type: 'separator' },
        { command: 'core:three', position: 'after=core:one' },
        { type: 'separator' }
      ]
      const expected = [
        { command: 'core:one' },
        { command: 'core:three', position: 'after=core:one' },
        { type: 'separator' },
        { command: 'core:two' }
      ]
      expect(sortMenuItems(items)).toEqual(expected)
    })
    it("moves all items in the moving item's group", () => {
      const items = [
        { command: 'core:one' },
        { type: 'separator' },
        { command: 'core:two' },
        { type: 'separator' },
        { command: 'core:three', position: 'after=core:one' },
        { command: 'core:four' },
        { type: 'separator' }
      ]
      const expected = [
        { command: 'core:one' },
        { command: 'core:three', position: 'after=core:one' },
        { command: 'core:four' },
        { type: 'separator' },
        { command: 'core:two' }
      ]
      expect(sortMenuItems(items)).toEqual(expected)
    })
    it("ignores positions relative to commands that don't exist", () => {
      const items = [
        { command: 'core:one' },
        { type: 'separator' },
        { command: 'core:two' },
        { type: 'separator' },
        { command: 'core:three', position: 'after=core:does-not-exist' },
        { command: 'core:four', position: 'after=core:one' },
        { type: 'separator' }
      ]
      const expected = [
        { command: 'core:one' },
        { command: 'core:three', position: 'after=core:does-not-exist' },
        { command: 'core:four', position: 'after=core:one' },
        { type: 'separator' },
        { command: 'core:two' }
      ]
      expect(sortMenuItems(items)).toEqual(expected)
    })
    it('can handle recursive group merging', () => {
      const items = [
        { command: 'core:one', position: 'after=core:three' },
        { command: 'core:two', position: 'before=core:one' },
        { command: 'core:three' }
      ]
      const expected = [
        { command: 'core:three' },
        { command: 'core:two', position: 'before=core:one' },
        { command: 'core:one', position: 'after=core:three' }
      ]
      expect(sortMenuItems(items)).toEqual(expected)
    })
  })
  describe('sorts items within their ultimate group', () => {
    it('does a simple sort', () => {
      const items = [
        { command: 'core:two', position: 'after=core:one' },
        { command: 'core:one' }
      ]
      expect(sortMenuItems(items)).toEqual([
        { command: 'core:one' },
        { command: 'core:two', position: 'after=core:one' }
      ])
    })
    it('resolves cycles by ignoring things that conflict', () => {
      const items = [
        { command: 'core:two', position: 'after=core:one' },
        { command: 'core:one', position: 'after=core:two' }
      ]
      expect(sortMenuItems(items)).toEqual([
        { command: 'core:one', position: 'after=core:two' },
        { command: 'core:two', position: 'after=core:one' }
      ])
    })
  })
  describe('sorts groups', () => {
    it('does a simple sort', () => {
      const items = [
        { command: 'core:two', position: 'afterGroupContaining=core:one' },
        { type: 'separator' },
        { command: 'core:one' }
      ]
      expect(sortMenuItems(items)).toEqual([
        { command: 'core:one' },
        { type: 'separator' },
        { command: 'core:two', position: 'afterGroupContaining=core:one' }
      ])
    })
    it('resolves cycles by ignoring things that conflict', () => {
      const items = [
        { command: 'core:two', position: 'afterGroupContaining=core:one' },
        { type: 'separator' },
        { command: 'core:one', position: 'afterGroupContaining=core:two' }
      ]
      expect(sortMenuItems(items)).toEqual([
        { command: 'core:one', position: 'afterGroupContaining=core:two' },
        { type: 'separator' },
        { command: 'core:two', position: 'afterGroupContaining=core:one' }
      ])
    })
    it('ignores references to commands that do not exist', () => {
      const items = [
        { command: 'core:one' },
        { type: 'separator' },
        {
          command: 'core:two',
          position: 'afterGroupContaining=core:does-not-exist'
        }
      ]
      expect(sortMenuItems(items)).toEqual([
        { command: 'core:one' },
        { type: 'separator' },
        {
          command: 'core:two',
          position: 'afterGroupContaining=core:does-not-exist'
        }
      ])
    })
    it('only respects the first matching [before|after]GroupContaining rule in a given group', () => {
      const items = [
        { command: 'core:one' },
        { type: 'separator' },
        { command: 'core:three', position: 'beforeGroupContaining=core:one' },
        { command: 'core:four', position: 'afterGroupContaining=core:two' },
        { type: 'separator' },
        { command: 'core:two' }
      ]
      expect(sortMenuItems(items)).toEqual([
        { command: 'core:three', position: 'beforeGroupContaining=core:one' },
        { command: 'core:four', position: 'afterGroupContaining=core:two' },
        { type: 'separator' },
        { command: 'core:one' },
        { type: 'separator' },
        { command: 'core:two' }
      ])
    })
  })
})
