// UTILS

function splitArray (arr, predicate) {
  let lastArr = []
  const multiArr = [lastArr]
  arr.forEach(item => {
    if (predicate(item)) {
      if (lastArr.length > 0) {
        lastArr = []
        multiArr.push(lastArr)
      }
    } else {
      lastArr.push(item)
    }
  })
  return multiArr
}

function joinArrays (arrays, joiner) {
  const joinedArr = []
  arrays.forEach((arr, i) => {
    if (i > 0 && arr.length > 0) {
      joinedArr.push(joiner)
    }
    joinedArr.push(...arr)
  })
  return joinedArr
}

// Sort nodes topologically using a depth-first approach. Encountered cycles
// and broken.
function sortTopologically (originalOrder, edgesById) {
  const sorted = []
  const marked = new Set()

  function visit (id) {
    if (marked.has(id)) {
      // Either this node has already been placed, or we have encountered a
      // cycle and need to exit.
      return
    }
    marked.add(id)
    const edges = edgesById.get(id)
    if (edges != null) {
      edges.forEach(visit)
    }
    sorted.push(id)
  }

  while (true) {
    const unmarkedId = originalOrder.find(id => !marked.has(id))
    if (unmarkedId == null) {
      break
    }
    visit(unmarkedId)
  }
  return sorted
}

// HELPERS
function parsePositions (item) {
  const tuple = item.position.split('=')
  if (tuple.length !== 2) {
    throw Error(`Malformed position argument ${item.position}`)
  }
  const [relationship, toCommand] = tuple
  return [relationship, [toCommand]]
}

// MENU SPECIFIC CODE

// Merge groups based on before/after positions
// Mutates both the array of groups, and the individual group arrays.
function mergeGroups (groups) {
  function attemptToMergeGroup () {
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i]
      for (const item of group) {
        if (item.position == null) {
          continue
        }
        const [relationship, toCommands] = parsePositions(item)
        if (relationship !== 'before' && relationship !== 'after') {
          continue
        }
        for (const command of toCommands) {
          const mergeTarget = groups.find(
            candiateGroup =>
              candiateGroup !== group &&
              candiateGroup.some(
                candidateItem => candidateItem.command === command
              )
          )
          if (mergeTarget == null) {
            break
          }
          // Merge with group containing `command`
          mergeTarget.push(...group)
          groups.splice(i, 1)
          return true
        }
      }
    }
    return false
  }
  while (attemptToMergeGroup()) {}
  return groups
}

function sortItemsInGroup (group) {
  const originalOrder = group.map((node, i) => i)
  const edgesByIndex = new Map()
  const commandToIndex = new Map(group.map((item, i) => [item.command, i]))

  const addEdgeToIndex = (i, edgeTo) => {
    if (!edgesByIndex.has(i)) {
      edgesByIndex.set(i, [])
    }
    edgesByIndex.get(i).push(edgeTo)
  }

  group.forEach((item, i) => {
    if (item.position == null) {
      return
    }
    const [relationship, toCommands] = parsePositions(item)
    toCommands.forEach(toCommand => {
      const to = commandToIndex.get(toCommand)
      if (to != null) {
        switch (relationship) {
          case 'before':
            addEdgeToIndex(to, i)
            break
          case 'after':
            addEdgeToIndex(i, to)
            break
        }
      }
    })
  })

  const sortedNodes = sortTopologically(originalOrder, edgesByIndex)

  return sortedNodes.map(i => group[i])
}

function sortGroups (groups) {
  const originalOrder = groups.map((item, i) => i)
  const edgesByIndex = new Map()
  const addEdgeToIndex = (index, edgeTo) => {
    if (!edgesByIndex.has(index)) {
      edgesByIndex.set(index, [])
    }
    edgesByIndex.get(index).push(edgeTo)
  }
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    itemLoop: for (const item of group) {
      if (item.position == null) {
        continue
      }
      const [relationship, toCommands] = parsePositions(item)
      for (const command of toCommands) {
        if (
          relationship === 'beforeGroupContaining' ||
          relationship === 'afterGroupContaining'
        ) {
          const to = groups.findIndex(
            candiateGroup =>
              candiateGroup !== group &&
              candiateGroup.some(
                candidateItem => candidateItem.command === command
              )
          )
          if (to !== -1) {
            switch (relationship) {
              case 'afterGroupContaining':
                addEdgeToIndex(i, to)
                break
              case 'beforeGroupContaining':
                addEdgeToIndex(to, i)
                break
            }
            break itemLoop
          }
        }
      }
    }
  }

  const sortedGroupIndexes = sortTopologically(originalOrder, edgesByIndex)
  return sortedGroupIndexes.map(i => groups[i])
}

function isSeparator (item) {
  return item.type === 'separator'
}

function sortMenuItems (menuItems) {
  // Split the items into their implicit groups based upon separators.
  const groups = splitArray(menuItems, isSeparator)
  // Merge groups that contain before/after references to eachother.
  const mergedGroups = mergeGroups(groups)
  // Sort each individual group internally.
  const mergedGroupsWithSortedItems = mergedGroups.map(sortItemsInGroup)
  // Sort the groups based upon their beforeGroupContaining/afterGroupContaining
  // references.
  const sortedGroups = sortGroups(mergedGroupsWithSortedItems)
  // Join the groups back
  return joinArrays(sortedGroups, { type: 'separator' })
}

module.exports = {sortMenuItems}
