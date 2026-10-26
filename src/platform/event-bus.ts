/**
 * An in-process event bus. THIS IS A STUB - you finish it.
 *
 * Requirements:
 *   - a handler that throws must not stop the other handlers
 *   - publish returns the number of handlers it reached
 *   - subscribing the same function twice registers it twice (do not dedupe)
 *   - publishing a name nobody listens to is fine and returns 0
 */

/** The events this system publishes. Add to it as you need to. */

export interface DomainEvents {
  "order.placed": {
    orderId: string;
    email: string;
    amountPaise: number;
  };
}

export type EventName = keyof DomainEvents;

export type Handler<K extends EventName> = (
  payload: DomainEvents[K]
) => void;

export type Unsubscribe = () => void;

export interface EventBus {
  publish<K extends EventName>(
    name: K,
    payload: DomainEvents[K]
  ): number;

  subscribe<K extends EventName>(
    name: K,
    fn: Handler<K>
  ): Unsubscribe;
}

export function createEventBus(): EventBus {
  const handlers = new Map<EventName, Handler<EventName>[]>();

  return {
    publish<K extends EventName>(
      name: K,
      payload: DomainEvents[K]
    ): number {
      const listeners = [...(handlers.get(name) ?? [])];
      let reached = 0;

      for (const handler of listeners) {
        reached++;

        try {
          handler(payload);
        } catch {
          // Continue to the next handler if one fails.
        }
      }

      return reached;
    },

    subscribe<K extends EventName>(
      name: K,
      fn: Handler<K>
    ): Unsubscribe {
      const listeners = handlers.get(name) ?? [];
      const handler = fn as Handler<EventName>;

      // Allow the same function to be subscribed multiple times.
      listeners.push(handler);
      handlers.set(name, listeners);

      return () => {
        const current = handlers.get(name);

        if (!current) return;

        const index = current.indexOf(handler);

        if (index !== -1) {
          current.splice(index, 1);
        }

        if (current.length === 0) {
          handlers.delete(name);
        }
      };
    },
  };
}

export const eventBus = createEventBus();
