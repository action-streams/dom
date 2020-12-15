import { Action } from '@action-streams/core';
import nextTick from 'next-tick';
import {
  create,
  createProperties,
  diff,
  h,
  patch,
  VChild,
  VNode as Vdom,
  VPatch,
} from 'virtual-dom';

const VdomActionType = 'vdom';

interface VdomAction extends Action {
  payload: Vdom;
  type: typeof VdomActionType;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Element extends Vdom {}
  }
}

declare class HookFocus {
  hook: (node: HTMLElement) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function HookFocus() {}

HookFocus.prototype.hook = (node: HTMLElement): void => {
  nextTick(() => {
    if (document.activeElement !== node) {
      node.focus();
    }
  });
};

const hookFocus = new HookFocus();

const jsx = (
  tagName: string,
  properties: createProperties,
  children: string | VChild[]
): Vdom => {
  if (properties?.focused !== undefined) {
    return h(
      tagName,
      {
        ...properties,
        focused: properties.focused ? hookFocus : undefined,
      },
      children
    );
  }

  return h(tagName, properties, children);
};

const renderTo = (root: Element): ((action: VdomAction) => void) => {
  let prevElement: Element = root;
  let prevVdom: Vdom;

  return (action) => {
    if (action.type === VdomActionType) {
      const vdom: Vdom = action.payload;
      let element: Element;

      if (prevVdom) {
        const patches: VPatch[] = diff(prevVdom, vdom);

        element = patch(prevElement, patches);
      } else {
        element = create(vdom);

        prevElement.appendChild(element);
      }

      prevElement = element;
      prevVdom = vdom;
    }
  };
};

export { jsx, renderTo, Vdom, VdomAction, VdomActionType };
