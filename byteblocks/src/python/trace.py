"""Bounded snapshots of user frames. Runs only in the isolated Python worker."""

import ast as _ast
import collections as _collections
import json as _json
import sys as _sys
import types as _types


def _bb_start(source, emit):
    views = {}
    try:
        for node in _ast.walk(_ast.parse(source)):
            if isinstance(node, _ast.Call) and isinstance(node.func, _ast.Attribute):
                owner = node.func.value
                if isinstance(owner, _ast.Name):
                    method = node.func.attr
                    if method == "popleft" or (
                        method == "pop" and len(node.args) == 1
                        and isinstance(node.args[0], _ast.Constant)
                        and node.args[0].value == 0
                    ):
                        views[owner.id] = "queue"
                    elif method == "pop" and not node.args:
                        views.setdefault(owner.id, "stack")
    except SyntaxError:
        pass  # Let Python report the original syntax error.

    nodes_left = 0

    def value(item, depth=0, seen=frozenset()):
        nonlocal nodes_left
        nodes_left -= 1
        cls = type(item)
        name = type.__getattribute__(cls, "__name__")[:80]
        if item is None or any(cls is known for known in (bool, int, float, str)):
            if cls is str:
                text = repr(item[:160]) + ("…" if len(item) > 160 else "")
            elif cls is int and item.bit_length() > 512:
                text = "<large integer>"
            else:
                text = repr(item)
            return {"kind": "scalar", "type": name, "text": text}
        kinds = ((list, "list"), (tuple, "tuple"), (dict, "dict"),
                 (set, "set"), (frozenset, "set"), (_collections.deque, "deque"))
        kind = next((label for known, label in kinds if cls is known), None)
        if kind is None:
            return {"kind": "object", "type": name, "text": "<" + name + ">"}
        size = len(item)
        result = {"kind": kind, "type": name, "text": name, "size": size}
        if id(item) in seen:
            result["text"] = "↻ circular reference"
            return result
        if depth >= 3 or nodes_left <= 0:
            result["text"] = name + " (" + str(size) + " items)"
            return result
        seen = seen | {id(item)}
        if cls is dict:
            result["entries"] = []
            for index, (key, val) in enumerate(item.items()):
                if index >= 40 or nodes_left <= 0:
                    break
                result["entries"].append({"key": value(key, depth + 1, seen),
                                          "value": value(val, depth + 1, seen)})
        else:
            # Sets have no positional meaning. Sort supported scalar sets for a
            # stable display; never invoke user-defined repr or comparison.
            items = item
            if cls is set or cls is frozenset:
                if size > 40:
                    result["text"] = name + " (" + str(size) + " items; not expanded)"
                    return result
                items = sorted(item, key=lambda x: _json.dumps(value(x, 3), sort_keys=True))
            result["items"] = []
            for index, val in enumerate(items):
                if index >= 40 or nodes_left <= 0:
                    break
                result["items"].append(value(val, depth + 1, seen))
        return result

    count = 0
    total = 0
    frame_ids = {}
    next_frame_id = 0

    def trace(frame, event, arg):
        nonlocal count, total, nodes_left, next_frame_id
        if frame.f_code.co_filename != "main.py":
            return None
        if event == "call":
            next_frame_id += 1
            frame_ids[id(frame)] = next_frame_id
            return trace
        if event not in ("line", "return", "exception"):
            return trace
        if count >= 600 or total >= 2_000_000:
            emit('{"truncated":true}')
            _sys.settrace(None)
            return None
        nodes_left = 1200
        frames = []
        current = frame
        while current is not None and len(frames) < 12:
            if current.f_code.co_filename == "main.py":
                identity = id(current)
                if identity not in frame_ids:
                    next_frame_id += 1
                    frame_ids[identity] = next_frame_id
                variables = []
                names = sorted(key for key in current.f_locals if type(key) is str)
                for key in names:
                    val = current.f_locals[key]
                    if key.startswith("__") or callable(val) or type(val) is _types.ModuleType:
                        continue
                    if len(variables) >= 40:
                        break
                    view = views.get(key)
                    if view is None and "stack" in key.lower():
                        view = "stack"
                    variables.append({"name": key[:100], "value": value(val), "view": view})
                frames.append({"id": frame_ids[identity], "name": current.f_code.co_name[:100],
                               "line": current.f_lineno, "variables": variables})
            current = current.f_back
        step = {"event": event, "line": frame.f_lineno, "frames": list(reversed(frames))}
        if event == "return":
            step["result"] = value(arg)
        elif event == "exception":
            step["exception"] = arg[0].__name__[:100]
        payload = _json.dumps(step, ensure_ascii=True, separators=(",", ":"))
        if total + len(payload) > 2_000_000:
            emit('{"truncated":true}')
            _sys.settrace(None)
            return None
        count += 1
        total += len(payload)
        emit(payload)
        return trace

    _sys.settrace(trace)


def _bb_stop():
    _sys.settrace(None)
