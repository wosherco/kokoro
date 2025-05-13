import { describe, expect, it, vi } from "vitest";

import {
  diff,
  diffApply,
  diffApplyIndividual,
  diffApplySequential,
} from "../../src/poldash/diff";

interface TestItem {
  id: number;
  name: string;
  data?: {
    name: string;
    age: number;
  };
}

describe("diff", () => {
  it("should handle arrays of objects", () => {
    const original: TestItem[] = [
      { id: 1, name: "John" },
      { id: 2, name: "Jane" },
    ];
    const updated: TestItem[] = [
      { id: 1, name: "Johnny" },
      { id: 3, name: "Bob" },
    ];

    const result = diff(
      original,
      updated,
      (item) => item.id,
      (original, updated) => original.name !== updated.name,
    );

    expect(result.toAdd).toEqual([{ id: 3, name: "Bob" }]);
    expect(result.toRemove).toEqual([{ id: 2, name: "Jane" }]);
    expect(result.toUpdate).toEqual([{ id: 1, name: "Johnny" }]);
    expect(result.toKeep).toEqual([]);
  });

  it("should handle records", () => {
    const original: Record<string, TestItem> = {
      "1": { id: 1, name: "John" },
      "2": { id: 2, name: "Jane" },
    };
    const updated: Record<string, TestItem> = {
      "1": { id: 1, name: "Johnny" },
      "3": { id: 3, name: "Bob" },
    };

    const result = diff(
      original,
      updated,
      (item) => item.id,
      (original, updated) => original.name !== updated.name,
    );

    expect(result.toAdd).toEqual([{ id: 3, name: "Bob" }]);
    expect(result.toRemove).toEqual([{ id: 2, name: "Jane" }]);
    expect(result.toUpdate).toEqual([{ id: 1, name: "Johnny" }]);
    expect(result.toKeep).toEqual([]);
  });

  it("should keep items that don't need updating", () => {
    const original: TestItem[] = [{ id: 1, name: "John" }];
    const updated: TestItem[] = [{ id: 1, name: "John" }];

    const result = diff(
      original,
      updated,
      (item) => item.id,
      (original, updated) => original.name !== updated.name,
    );

    expect(result.toAdd).toEqual([]);
    expect(result.toRemove).toEqual([]);
    expect(result.toUpdate).toEqual([]);
    expect(result.toKeep).toEqual([{ id: 1, name: "John" }]);
  });

  it("should handle empty collections", () => {
    const original: TestItem[] = [];
    const updated: TestItem[] = [];

    const result = diff(
      original,
      updated,
      (item) => item.id,
      (original, updated) => original.name !== updated.name,
    );

    expect(result.toAdd).toEqual([]);
    expect(result.toRemove).toEqual([]);
    expect(result.toUpdate).toEqual([]);
    expect(result.toKeep).toEqual([]);
  });

  it("should handle complex objects", () => {
    const original: TestItem[] = [
      { id: 1, name: "John", data: { name: "John", age: 30 } },
      { id: 2, name: "Jane", data: { name: "Jane", age: 25 } },
    ];
    const updated: TestItem[] = [
      { id: 1, name: "John", data: { name: "John", age: 31 } },
      { id: 3, name: "Bob", data: { name: "Bob", age: 40 } },
    ];

    const result = diff(
      original,
      updated,
      (item) => item.id,
      (original, updated) => original.data?.age !== updated.data?.age,
    );

    expect(result.toAdd).toEqual([
      { id: 3, name: "Bob", data: { name: "Bob", age: 40 } },
    ]);
    expect(result.toRemove).toEqual([
      { id: 2, name: "Jane", data: { name: "Jane", age: 25 } },
    ]);
    expect(result.toUpdate).toEqual([
      { id: 1, name: "John", data: { name: "John", age: 31 } },
    ]);
    expect(result.toKeep).toEqual([]);
  });

  it("should work with property keys as iteratee", () => {
    const original: TestItem[] = [
      { id: 1, name: "John" },
      { id: 2, name: "Jane" },
    ];
    const updated: TestItem[] = [
      { id: 1, name: "Johnny" },
      { id: 3, name: "Bob" },
    ];

    const result = diff(
      original,
      updated,
      "id",
      (original, updated) => original.name !== updated.name,
    );

    expect(result.toAdd).toEqual([{ id: 3, name: "Bob" }]);
    expect(result.toRemove).toEqual([{ id: 2, name: "Jane" }]);
    expect(result.toUpdate).toEqual([{ id: 1, name: "Johnny" }]);
    expect(result.toKeep).toEqual([]);
  });
});

describe("diffApply", () => {
  it("should call appropriate callbacks with entire lists", async () => {
    const diffResult = {
      toAdd: [{ id: 1, name: "New" }],
      toRemove: [{ id: 2, name: "Old" }],
      toUpdate: [{ id: 3, name: "Updated" }],
      toKeep: [{ id: 4, name: "Same" }],
    };

    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onUpdate = vi.fn();
    const onKeep = vi.fn();

    await diffApply(diffResult, {
      onAdd,
      onRemove,
      onUpdate,
      onKeep,
    });

    expect(onAdd).toHaveBeenCalledWith([{ id: 1, name: "New" }]);
    expect(onRemove).toHaveBeenCalledWith([{ id: 2, name: "Old" }]);
    expect(onUpdate).toHaveBeenCalledWith([{ id: 3, name: "Updated" }]);
    expect(onKeep).toHaveBeenCalledWith([{ id: 4, name: "Same" }]);
  });

  it("should handle missing callbacks", async () => {
    const diffResult = {
      toAdd: [{ id: 1, name: "New" }],
      toRemove: [{ id: 2, name: "Old" }],
      toUpdate: [{ id: 3, name: "Updated" }],
      toKeep: [{ id: 4, name: "Same" }],
    };

    const onAdd = vi.fn();

    await diffApply(diffResult, { onAdd });

    expect(onAdd).toHaveBeenCalledWith([{ id: 1, name: "New" }]);
  });

  it("should handle async callbacks", async () => {
    const diffResult = {
      toAdd: [{ id: 1, name: "New" }],
      toRemove: [{ id: 2, name: "Old" }],
      toUpdate: [{ id: 3, name: "Updated" }],
      toKeep: [{ id: 4, name: "Same" }],
    };

    const onAdd = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    const onRemove = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    const onUpdate = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    const onKeep = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

    const startTime = Date.now();
    await diffApply(diffResult, {
      onAdd,
      onRemove,
      onUpdate,
      onKeep,
    });
    const endTime = Date.now();

    // All operations should be executed in parallel, so total time should be ~400ms (100ms for each operation)
    expect(endTime - startTime).toBeLessThan(500);

    expect(onAdd).toHaveBeenCalledWith([{ id: 1, name: "New" }]);
    expect(onRemove).toHaveBeenCalledWith([{ id: 2, name: "Old" }]);
    expect(onUpdate).toHaveBeenCalledWith([{ id: 3, name: "Updated" }]);
    expect(onKeep).toHaveBeenCalledWith([{ id: 4, name: "Same" }]);
  });

  it("should not execute callbacks when there are no items to process", async () => {
    const diffResult = {
      toAdd: [],
      toRemove: [],
      toUpdate: [],
      toKeep: [],
    };

    const callbacks = {
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      onUpdate: vi.fn(),
      onKeep: vi.fn(),
    };

    await diffApply(diffResult, callbacks);

    expect(callbacks.onAdd).not.toHaveBeenCalled();
    expect(callbacks.onRemove).not.toHaveBeenCalled();
    expect(callbacks.onUpdate).not.toHaveBeenCalled();
    expect(callbacks.onKeep).not.toHaveBeenCalled();
  });

  it("should only execute callbacks for operations with items", async () => {
    const diffResult = {
      toAdd: [{ id: 1 }],
      toRemove: [],
      toUpdate: [{ id: 2 }],
      toKeep: [],
    };

    const callbacks = {
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      onUpdate: vi.fn(),
      onKeep: vi.fn(),
    };

    await diffApply(diffResult, callbacks);

    expect(callbacks.onAdd).toHaveBeenCalledWith([{ id: 1 }]);
    expect(callbacks.onRemove).not.toHaveBeenCalled();
    expect(callbacks.onUpdate).toHaveBeenCalledWith([{ id: 2 }]);
    expect(callbacks.onKeep).not.toHaveBeenCalled();
  });
});

describe("diffApplyIndividual", () => {
  it("should call appropriate callbacks for each item", async () => {
    const diffResult = {
      toAdd: [{ id: 1, name: "New" }],
      toRemove: [{ id: 2, name: "Old" }],
      toUpdate: [{ id: 3, name: "Updated" }],
      toKeep: [{ id: 4, name: "Same" }],
    };

    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onUpdate = vi.fn();
    const onKeep = vi.fn();

    await diffApplyIndividual(diffResult, {
      onAdd,
      onRemove,
      onUpdate,
      onKeep,
    });

    expect(onAdd).toHaveBeenCalledWith({ id: 1, name: "New" });
    expect(onRemove).toHaveBeenCalledWith({ id: 2, name: "Old" });
    expect(onUpdate).toHaveBeenCalledWith({ id: 3, name: "Updated" });
    expect(onKeep).toHaveBeenCalledWith({ id: 4, name: "Same" });
  });

  it("should handle missing callbacks", async () => {
    const diffResult = {
      toAdd: [{ id: 1, name: "New" }],
      toRemove: [{ id: 2, name: "Old" }],
      toUpdate: [{ id: 3, name: "Updated" }],
      toKeep: [{ id: 4, name: "Same" }],
    };

    const onAdd = vi.fn();

    await diffApplyIndividual(diffResult, { onAdd });

    expect(onAdd).toHaveBeenCalledWith({ id: 1, name: "New" });
  });

  it("should handle async callbacks", async () => {
    const diffResult = {
      toAdd: [{ id: 1, name: "New" }],
      toRemove: [{ id: 2, name: "Old" }],
      toUpdate: [{ id: 3, name: "Updated" }],
      toKeep: [{ id: 4, name: "Same" }],
    };

    const onAdd = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    const onRemove = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    const onUpdate = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    const onKeep = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

    const startTime = Date.now();
    await diffApplyIndividual(diffResult, {
      onAdd,
      onRemove,
      onUpdate,
      onKeep,
    });
    const endTime = Date.now();

    // All operations should be executed in parallel, so total time should be ~400ms (100ms for each operation)
    expect(endTime - startTime).toBeLessThan(500);

    expect(onAdd).toHaveBeenCalledWith({ id: 1, name: "New" });
    expect(onRemove).toHaveBeenCalledWith({ id: 2, name: "Old" });
    expect(onUpdate).toHaveBeenCalledWith({ id: 3, name: "Updated" });
    expect(onKeep).toHaveBeenCalledWith({ id: 4, name: "Same" });
  });

  it("should not execute callbacks when there are no items to process", async () => {
    const diffResult = {
      toAdd: [],
      toRemove: [],
      toUpdate: [],
      toKeep: [],
    };

    const callbacks = {
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      onUpdate: vi.fn(),
      onKeep: vi.fn(),
    };

    await diffApplyIndividual(diffResult, callbacks);

    expect(callbacks.onAdd).not.toHaveBeenCalled();
    expect(callbacks.onRemove).not.toHaveBeenCalled();
    expect(callbacks.onUpdate).not.toHaveBeenCalled();
    expect(callbacks.onKeep).not.toHaveBeenCalled();
  });

  it("should only execute callbacks for operations with items", async () => {
    const diffResult = {
      toAdd: [{ id: 1 }],
      toRemove: [],
      toUpdate: [{ id: 2 }],
      toKeep: [],
    };

    const callbacks = {
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      onUpdate: vi.fn(),
      onKeep: vi.fn(),
    };

    await diffApplyIndividual(diffResult, callbacks);

    expect(callbacks.onAdd).toHaveBeenCalledWith({ id: 1 });
    expect(callbacks.onRemove).not.toHaveBeenCalled();
    expect(callbacks.onUpdate).toHaveBeenCalledWith({ id: 2 });
    expect(callbacks.onKeep).not.toHaveBeenCalled();
  });
});

describe("diffApplySequential", () => {
  it("should call appropriate callbacks for each item", async () => {
    const diffResult = {
      toAdd: [{ id: 1, name: "New" }],
      toRemove: [{ id: 2, name: "Old" }],
      toUpdate: [{ id: 3, name: "Updated" }],
      toKeep: [{ id: 4, name: "Same" }],
    };

    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const onUpdate = vi.fn();
    const onKeep = vi.fn();

    await diffApplySequential(diffResult, {
      onAdd,
      onRemove,
      onUpdate,
      onKeep,
    });

    expect(onAdd).toHaveBeenCalledWith({ id: 1, name: "New" });
    expect(onRemove).toHaveBeenCalledWith({ id: 2, name: "Old" });
    expect(onUpdate).toHaveBeenCalledWith({ id: 3, name: "Updated" });
    expect(onKeep).toHaveBeenCalledWith({ id: 4, name: "Same" });
  });

  it("should handle missing callbacks", async () => {
    const diffResult = {
      toAdd: [{ id: 1, name: "New" }],
      toRemove: [{ id: 2, name: "Old" }],
      toUpdate: [{ id: 3, name: "Updated" }],
      toKeep: [{ id: 4, name: "Same" }],
    };

    const onAdd = vi.fn();

    await diffApplySequential(diffResult, { onAdd });

    expect(onAdd).toHaveBeenCalledWith({ id: 1, name: "New" });
  });

  it("should execute callbacks sequentially", async () => {
    const diffResult = {
      toAdd: [
        { id: 1, name: "New1" },
        { id: 2, name: "New2" },
      ],
      toRemove: [
        { id: 3, name: "Old1" },
        { id: 4, name: "Old2" },
      ],
      toUpdate: [
        { id: 5, name: "Updated1" },
        { id: 6, name: "Updated2" },
      ],
      toKeep: [
        { id: 7, name: "Same1" },
        { id: 8, name: "Same2" },
      ],
    };

    type diffVal = (typeof diffResult)["toAdd"][number];

    const executionOrder: string[] = [];

    // Create mock functions that track execution order and have delays
    const onAdd = vi.fn().mockImplementation(async (item: diffVal) => {
      executionOrder.push(`add-${item.id}`);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const onRemove = vi.fn().mockImplementation(async (item: diffVal) => {
      executionOrder.push(`remove-${item.id}`);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const onUpdate = vi.fn().mockImplementation(async (item: diffVal) => {
      executionOrder.push(`update-${item.id}`);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const onKeep = vi.fn().mockImplementation(async (item: diffVal) => {
      executionOrder.push(`keep-${item.id}`);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    await diffApplySequential(diffResult, {
      onAdd,
      onRemove,
      onUpdate,
      onKeep,
    });

    // Verify items were processed in the expected sequential order
    expect(executionOrder).toEqual([
      // Remove operations first, in sequence
      "remove-3",
      "remove-4",
      // Then update operations, in sequence
      "update-5",
      "update-6",
      // Then add operations, in sequence
      "add-1",
      "add-2",
      // Then keep operations, in sequence
      "keep-7",
      "keep-8",
    ]);

    // Verify each callback was called the expected number of times
    expect(onRemove).toHaveBeenCalledTimes(2);
    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onAdd).toHaveBeenCalledTimes(2);
    expect(onKeep).toHaveBeenCalledTimes(2);
  });

  it("should not execute callbacks when there are no items to process", async () => {
    const diffResult = {
      toAdd: [],
      toRemove: [],
      toUpdate: [],
      toKeep: [],
    };

    const callbacks = {
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      onUpdate: vi.fn(),
      onKeep: vi.fn(),
    };

    await diffApplySequential(diffResult, callbacks);

    expect(callbacks.onAdd).not.toHaveBeenCalled();
    expect(callbacks.onRemove).not.toHaveBeenCalled();
    expect(callbacks.onUpdate).not.toHaveBeenCalled();
    expect(callbacks.onKeep).not.toHaveBeenCalled();
  });

  it("should only execute callbacks for operations with items", async () => {
    const diffResult = {
      toAdd: [{ id: 1 }],
      toRemove: [],
      toUpdate: [{ id: 2 }],
      toKeep: [],
    };

    const callbacks = {
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      onUpdate: vi.fn(),
      onKeep: vi.fn(),
    };

    await diffApplySequential(diffResult, callbacks);

    expect(callbacks.onAdd).toHaveBeenCalledWith({ id: 1 });
    expect(callbacks.onRemove).not.toHaveBeenCalled();
    expect(callbacks.onUpdate).toHaveBeenCalledWith({ id: 2 });
    expect(callbacks.onKeep).not.toHaveBeenCalled();
  });
});
