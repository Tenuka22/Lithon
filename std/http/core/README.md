# core/

Primitives everything else reads or writes: byte-swap helpers,
the kernel-visible `Chunker` (int[8] struct fields), inputs/outputs,
templates, and buffer instances. Group order: 01 scalars → 02 state.
