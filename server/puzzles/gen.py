import sys
import random
import argparse
import collections
import string

from mitm import Mitm
from grid import Grid

LOOP_TRIES = 1000

def color_tubes(grid):
    colors = ['']
    reset = ''
    tube_grid, uf = grid.make_tubes()
    letters = string.digits[1:] + string.ascii_letters
    char = collections.defaultdict(lambda: letters[len(char)])
    col = collections.defaultdict(lambda: colors[len(col) % len(colors)])
    for x in range(tube_grid.w):
        for y in range(tube_grid.h):
            if tube_grid[x, y] == 'x':
                tube_grid[x, y] = char[uf.find( (x, y))]
            tube_grid[x, y] = col[uf.find( (x, y))] + tube_grid[x, y] + reset
    return tube_grid

def has_loops(grid, uf):
    groups = len({uf.find((x, y)) for y in range(grid.h) for x in range(grid.w)})
    ends = sum(bool(grid[x, y] in 'v^<>') for y in range(grid.h) for x in range(grid.w))
    return ends != 2 * groups

def has_pair(tg, uf):
    for y in range(tg.h):
        for x in range(tg.w):
            for dx, dy in ((1, 0), (0, 1)):
                x1, y1 = x + dx, y + dy
                if x1 < tg.w and y1 < tg.h:
                    if tg[x, y] == tg[x1, y1] == 'x' \
                            and uf.find( (x, y)) == uf.find( (x1, y1)):
                        return True
    return False

def has_tripple(tg, uf):
    for y in range(tg.h):
        for x in range(tg.w):
            r = uf.find( (x, y))
            nbs = 0
            for dx, dy in (1, 0), (0, 1), (-1, 0), (0, -1):
                x1, y1 = x + dx, y + dy
                if 0 <= x1 < tg.w and 0 <= y1 < tg.h and uf.find( (x1, y1)) == r:
                    nbs += 1
            if nbs >= 3:
                return True
    return False

def make(w, h, mitm, min_numbers=0, max_numbers=1000):

    def test_ready(grid):
        sg = grid.shrink()
        stg, uf = sg.make_tubes()
        numbers = list(stg.values()).count('x') // 2
        return min_numbers <= numbers <= max_numbers \
                and not has_loops(sg, uf) \
                and not has_pair(stg, uf) \
                and not has_tripple(stg, uf) \

    grid = Grid(2 * w + 1, 2 * h + 1)

    while True:
        grid.clear()

        path = mitm.rand_path2(h, h, 0, -1)
        if not grid.test_path(path, 0, 0):
            continue
        grid.draw_path(path, 0, 0)
        grid[0, 0], grid[0, 2 * h] = '\\', '/'

        path2 = mitm.rand_path2(h, h, 0, -1)
        if not grid.test_path(path2, 2 * w, 2 * h, 0, -1):
            continue
        grid.draw_path(path2, 2 * w, 2 * h, 0, -1)
        grid[2 * w, 0], grid[2 * w, 2 * h] = '/', '\\'

        if test_ready(grid):
            return grid.shrink()

        tg, _ = grid.make_tubes()
        for tries in range(LOOP_TRIES):
            x, y = 2 * random.randrange(w), 2 * random.randrange(h)
            if tg[x, y] not in '-|':
                continue

            path = mitm.rand_loop(clock=1 if tg[x, y] == '-' else -1)
            if grid.test_path(path, x, y):
                grid.clear_path(path, x, y)
                grid.draw_path(path, x, y, loop=True)
                tg, _ = grid.make_tubes()
                sg = grid.shrink()
                stg, uf = sg.make_tubes()
                numbers = list(stg.values()).count('x') // 2
                if numbers > max_numbers:
                    break
                if test_ready(grid):
                    return sg

def generate_puzzle(width, height, gens=1, min_numbers=-1, max_numbers=-1):
    if width < 4 or height < 4:
        return

    n = int((width * height)**.5)
    min_numbers = n * 2 // 3 if min_numbers < 0 else min_numbers
    max_numbers = n * 3 // 2 if max_numbers < 0 else max_numbers

    mitm = Mitm(lr_price=2, t_price=1)
    mitm.prepare(min(20, max(height, 6)))

    puzzles = []

    for _ in range(gens):
        grid = make(width, height, mitm, min_numbers, max_numbers)
        color_grid = color_tubes(grid)
        puzzle_matrix = [] 
        for y in range(color_grid.h):
            row = []
            for x in range(color_grid.w):
                cell = color_grid[x, y]
                if cell.startswith('\x1b['):
                    number = cell.split('\x1b[')[1].split('m')[1]
                else:
                    number = cell
                row.append(number)
            puzzle_matrix.append(row)
        puzzles.append(puzzle_matrix)

    return puzzles

"""
n = 6
grid = generate_puzzle(width = n, height = n)
for row in grid[0]:
    print(row)
"""
