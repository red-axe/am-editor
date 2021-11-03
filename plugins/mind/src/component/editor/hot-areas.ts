import { Graph, Node } from '@antv/x6';
import { traverseTree } from './utils';

class HotAreas {
	#graph: Graph;

	constructor(graph: Graph) {
		this.#graph = graph;
	}

	/*setHotArea() {
		let hotAreas = []
        const roots = this.#graph.getRootNodes()
        const postFix = 'placeholder'
        //const showHotArea = this.get('showHotArea')
        // 设置根节点热区
        const root = roots[0]
        const rootBox = root.getBBox()
        const rootDx = 90
        const rootDy = 60
        hotAreas.push({
            minX: rootBox.x - rootDx,
            minY: rootBox.minY - rootDy,
            maxX: (rootBox.minX + rootBox.maxX) / 2,
            maxY: rootBox.maxY + rootDy,
            parent: root,
            current: root,
            id: root.id + 'left' + postFix,
            nth: root.children?.length || 0,
            side: 'left',
            color: 'orange'
        })
        hotAreas.push({
            minX: (rootBox.x + rootBox.width),
            minY: rootBox.y - rootBox.height + 20,
            maxX: (rootBox.x + rootBox.width),
            maxY:  rootBox.y + rootBox.height - 20,
            parent: root,
            current: root,
            id: root.id + 'right' + postFix,
            nth: root.children?.length || 0,
            side: 'right',
            color: 'pink'
        })
  
        function getNext(initNextIndex: number, child: Node, parent: Node) {
            const children = parent.children || []
            // 所在节点
            let nextIndex = initNextIndex
    
            if (!parent.parent) {
                while (children[nextIndex] && children[nextIndex].side !== child.side) {
                    nextIndex++
                }
            }
    
            while (children[nextIndex] && children[nextIndex].isPlaceholder) {
                nextIndex++
            }
    
            if (children[nextIndex] && children[nextIndex].side === child.side) {
                return children[nextIndex]
            }
        }
  
        function getLast(initNextIndex, child, parent) {
            const children = parent.children
            // 所在节点
            let lastIndex = initNextIndex
    
            if (!parent.parent) {
                while (children[lastIndex] && children[lastIndex].side !== child.side) {
                    lastIndex--
                }
            }
    
            while (children[lastIndex] && children[lastIndex].isPlaceholder) {
                lastIndex--
            }
    
            if (children[lastIndex] && children[lastIndex].side === child.side) {
                return children[lastIndex]
            }
        } 
        // 设置子节点热区
        traverseTree<Node>(root, (child: Node<Node.Properties>, parent: Node<Node.Properties>, index: number) => {
            const data = 
            if (child.isPlaceholder || !child.isVisible()) {
                return
            }
    
            const next = getNext(index + 1, child, parent)
            const last = getLast(index - 1, child, parent)
            const childBox = child.getBBox()
            const children = parent.children
            // 所在节点
            const firstSubDx = 90
            const dy = 16
            const isFirstRight = child.hierarchy === 2 && child.side === 'right'
            const isFirstLeft = child.hierarchy === 2 && child.side === 'left'
    
            if (!last) {
                hotAreas.push({
                    minX: isFirstRight ? childBox.minX - firstSubDx : childBox.minX,
                    minY: function () {
                        let minY = last ? childBox.minY : childBox.minY - dy
        
                        if (children[index - 1] && children[index - 1].isPlaceholder && children[index - 1].side === child.side) {
                            const placeholderBox = graph.find(children[index - 1].id).getBBox()
                            minY = placeholderBox.minY
                        }
        
                        return minY
                    }(),
                    maxX: isFirstLeft ? childBox.maxX + firstSubDx : childBox.maxX,
                    maxY: (childBox.minY + childBox.maxY) / 2,
                    parent: parent,
                    id: (last ? last.id : undefined) + child.id + parent.id + postFix,
                    side: child.side,
                    color: 'yellow',
                    nth: index
                })
            }
    
            if (next) {
                const nextBox = graph.find(next.id).getBBox()
                hotAreas.push({
                    minX: function () {
                        if (child.side === 'left') {
                            return Math.max(childBox.minX, nextBox.minX)
                        }
                        return isFirstRight ? childBox.minX - firstSubDx : childBox.minX
                    }(),
                    minY: (childBox.minY + childBox.maxY) / 2,
                    maxX: function () {
                        if (child.side === 'right') {
                            return Math.min(childBox.maxX, nextBox.maxX)
                        }
                        return isFirstLeft ? childBox.maxX + firstSubDx : childBox.maxX
                    }(),
                    maxY: (nextBox.minY + nextBox.maxY) / 2,
                    parent: parent,
                    id: child.id + (next ? next.id : undefined) + parent.id + postFix,
                    side: child.side,
                    color: 'blue',
                    nth: index + 1
                });
            } else {
                hotAreas.push({
                    minX: isFirstRight ? childBox.minX - firstSubDx : childBox.minX,
                    minY: (childBox.minY + childBox.maxY) / 2,
                    maxX: isFirstLeft ? childBox.maxX + firstSubDx : childBox.maxX,
                    maxY: function () {
                        let maxY = childBox.maxY + dy
                        if (children[index + 1] && children[index + 1].isPlaceholder && children[index + 1].side === child.side) {
                            const placeholderBox = graph.find(children[index + 1].id).getBBox()
                            maxY = placeholderBox.maxY
                        }
                        return maxY
                    }(),
                    parent: parent,
                    id: child.id + undefined + parent.id + postFix,
                    color: 'red',
                    nth: index + 1,
                    addOrder: 'push',
                    side: child.side
                })
            }
    
            if (!child.children || child.children.length === 0 || child.children.length === 1 && child.children[0].isPlaceholder) {
                const dx = 100
                const _dy = 0
                let box
    
                if (child.x > parent.x) {
                    box = {
                        minX: childBox.maxX,
                        minY: childBox.minY - _dy,
                        maxX: childBox.maxX + dx,
                        maxY: childBox.maxY + _dy
                    }
                } else {
                    box = {
                        minX: childBox.minX - dx,
                        minY: childBox.minY - _dy,
                        maxX: childBox.minX,
                        maxY: childBox.maxY + _dy
                    }
                }
    
                hotAreas.push({
                    ...box,
                    parent: child,
                    id: undefined + undefined + child.id + postFix,
                    nth: 0,
                    color: 'green',
                    side: child.side,
                    addOrder: 'push'
                })
            }
        }, parent => {
            return parent.children
        })
        this.set('hotAreas', hotAreas)
        showHotArea && this._drawHotAreaShape()
	}*/
}
