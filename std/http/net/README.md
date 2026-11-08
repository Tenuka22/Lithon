# net/ — socket transport

Chunked send/recv through the Chunker buffers.
The only syscalls permitted here: 41 socket, 42 connect, 44 send,
45 recv, 3 close.
