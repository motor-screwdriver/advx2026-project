"""Named handles for the 32-color project palette (tools/palette.json).

Every generator draws with these constants only — the pipeline then quantizes,
which is a no-op for compliant art and a safety net for everything else.
"""

K = '#0d0a1a'  # universal 2px outline
BG0 = '#16102b'  # deepest background purple
BG1 = '#241a45'
P0 = '#37286b'
P1 = '#4e3a9e'
P2 = '#7a5fd0'
P3 = '#b7a6ee'
W = '#f2e7d5'  # warm white
SK0 = '#f5c396'  # skin light
SK1 = '#e09a63'  # skin
SK2 = '#a95f3c'  # skin shadow
BR0 = '#5c2e1f'  # dark brown
BR1 = '#8a4b2a'  # brown
BR2 = '#c07b3f'  # light wood
R0 = '#8c2331'  # dark red
R1 = '#d94040'  # red
R2 = '#ff7a5c'  # coral
G0 = '#9e6b1e'  # dark gold
G1 = '#e8a23d'  # gold
G2 = '#ffc93c'  # bright gold
GR0 = '#1e4d2b'  # dark green
GR1 = '#3e8e41'  # green
GR2 = '#7bc74d'  # light green
B0 = '#1e3a5c'  # dark blue
B1 = '#2e6fb7'  # blue
B2 = '#6fc3e8'  # light blue
T0 = '#10333b'  # dark teal
T1 = '#2aa198'  # teal
PK = '#e86aa0'  # pink
GY0 = '#4a4f5c'  # dark gray
GY1 = '#8a8fa3'  # gray
GY2 = '#c9cfdb'  # light gray
