import {
  getNodes,
  getAnchors,
  findStore,
  getAnchorFromEdge,
  getEdgeById,
} from '../../store/controllers/storeApi';
import type {
  NodeType,
  EdgeType,
  StoreType,
  ResizeNodeType,
  UserEdgeType,
} from '$lib/store/types/types';
import { writable, derived, get, readable } from 'svelte/store';
import { stores } from '../../store/models/store';

/**
 * Class Edge that implements EdgeType.
 * @param id The id of the Edge
 * @param sourceX The X coordinate of the source Anchor 
 * @param sourceY The Y coordinate of the source Anchor
 * @param targetX The X coordinate of the target Anchor
 * @param targetY The Y coordinate of the target Anchor
 * @param canvasId The canvasId of the Svelvet component that holds the instantiated Edge
 * @param label The label of the Edge
 * @param type The type of the Edge (options: 'straight', 'smooth', 'step', or 'bezier'). If user doesn't specify, the type will default to 'bezier'.
 * @param labelBgColor The background color of the Edge label
 * @param labelTextColor The text color of the Edge label
 * @param edgeColor The color of the Edge
 * @param animate Boolean value to specify whether the Edge should be animated
 * @param noHandle 
 * @param arraw
 */
export class Edge implements EdgeType {
  constructor(
    public id: string,
    public sourceX: number,
    public sourceY: number,
    public targetX: number,
    public targetY: number,
    public canvasId: string,
    public label?: string,
    public type?: 'straight' | 'smooth' | 'step' | 'bezier',
    public labelBgColor?: string,
    public labelTextColor?: string,
    public edgeColor?: string,
    public animate?: boolean,
    public noHandle?: boolean,
    public arrow?: boolean
  ) {}

  // Calling delete on an edge also deletes associated anchors
  // TODO: maybe rename delete to make clear that effects will cascade to anchors? Or is documentation enough?
  delete() {
    const store = stores[this.canvasId];
    const { nodesStore, anchorsStore, edgesStore } = store;
    const sourceAnchor = getAnchorFromEdge(store, this.id, 'source'); // this is a bit wasteful
    const targetAnchor = getAnchorFromEdge(store, this.id, 'target');
    anchorsStore.update((anchors) => {
      for (const anchorId in anchors) {
        if (anchorId === sourceAnchor.id || anchorId == targetAnchor.id)
          delete anchors[anchorId];
      }
      return { ...anchors };
    });
    edgesStore.update((edges) => {
      delete edges[this.id];
      return { ...edges };
    });
  }

  // this method is going to construct an object that holds all the edge data that can be exported
  setExportableData() {
    const exportableData: UserEdgeType = {
      id: this.id,
      label: this.label,
      type: this.type,
      labelBgColor: this.labelBgColor,
      labelTextColor: this.labelTextColor,
      edgeColor: this.edgeColor,
      animate: this.animate,
      noHandle: this.noHandle,
      arrow: this.arrow,
      source: 'dummy', // these will be set later
      target: 'dummy', // these will be set later
    };

    // set source, target on exportableData
    const store = findStore(this.canvasId);
    const anchors = getAnchors(store, { edgeId: this.id });
    if (anchors.length !== 2) throw 'there should be two anchors per edge';
    for (const anchor of anchors) {
      if (anchor.sourceOrTarget === 'target')
        exportableData.target = anchor.nodeId;
      if (anchor.sourceOrTarget === 'source')
        exportableData.source = anchor.nodeId;
    }

    return exportableData;
  }
}
