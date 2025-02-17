import random
from puzzles.mitm import Mitm
from puzzles.grid import Grid


# Number of tries at adding loops to the grid before redrawing the side paths.
LOOP_TRIES = 1000

def has_loops(grid, uf):
    """ Check whether the puzzle has loops not attached to an endpoint. """
    groups = len({uf.find((x, y)) for y in range(grid.h) for x in range(grid.w)})
    ends = sum(bool(grid[x, y] in 'v^<>') for y in range(grid.h) for x in range(grid.w))
    return ends != 2 * groups


def has_pair(tg, uf):
    """ Check for a pair of endpoints next to each other. """
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
    """ Check whether a path has a point with three same-colored neighbours. """
    for y in range(tg.h):
        for x in range(tg.w):
            r = uf.find( (x, y))
            nbs = 0
            for dx, dy in ((1, 0), (0, 1), (-1, 0), (0, -1)):
                x1, y1 = x + dx, y + dy
                if 0 <= x1 < tg.w and 0 <= y1 < tg.h and uf.find( (x1, y1)) == r:
                    nbs += 1
            if nbs >= 3:
                return True
    return False


def make(w, h, mitm, min_numbers=0, max_numbers=1000):
    """ Creates a grid of size  w x h  without any loops or squares. """
    def test_ready(grid):
        # Test if grid is ready to be returned.
        sg = grid.shrink()
        stg, uf = sg.make_tubes()
        numbers = list(stg.values()).count('x') // 2
        return min_numbers <= numbers <= max_numbers \
                and not has_loops(sg, uf) \
                and not has_pair(stg, uf) \
                and not has_tripple(stg, uf)

    # Internally we work on a double size grid to handle crossings
    grid = Grid(2 * w + 1, 2 * h + 1)

    gtries = 0
    while True:
        grid.clear()

        # Add left side path
        path = mitm.rand_path2(h, h, 0, -1)
        if not grid.test_path(path, 0, 0):
            continue
        grid.draw_path(path, 0, 0)
        grid[0, 0], grid[0, 2 * h] = '\\', '/'

        # Add right side path
        path2 = mitm.rand_path2(h, h, 0, -1)
        if not grid.test_path(path2, 2 * w, 2 * h, 0, -1):
            continue
        grid.draw_path(path2, 2 * w, 2 * h, 0, -1)
        grid[2 * w, 0], grid[2 * w, 2 * h] = '/', '\\'

        # The puzzle might already be ready to return
        if test_ready(grid):
            return grid.shrink()

        # Add loops in the middle
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
        debug(grid)


def debug(s):
    try:
        if verbose:
            print(s, file=sys.stderr)
    except NameError:
        pass


def generate_puzzle(width=10, height=10, n=1, min_numbers=-1, max_numbers=-1, verbose=False, solve=False, zero=False, terminal_only=False):
    global args
    # Custom parameters used instead of argparse
    args = {
        "width": width,
        "height": height,
        "n": n,
        "min": min_numbers,
        "max": max_numbers,
        "verbose": verbose,
        "solve": solve,
        "zero": zero,
        "terminal_only": terminal_only,
    }
    
    w, h = args["width"], args["height"]
    if w < 4 or h < 4:
        return None

    n = int((w * h)**.5)
    min_numbers = n * 2 // 3 if args["min"] < 0 else args["min"]
    max_numbers = n * 3 // 2 if args["max"] < 0 else args["max"]

    debug('Preprocessing...')
    mitm = Mitm(lr_price=2, t_price=1)
    mitm.prepare(min(20, max(h, 6)))
    debug('Generating puzzle...')

    for _ in range(args["n"]):
        grid = make(w, h, mitm, min_numbers, max_numbers)
        
        # Return only the numerical representation of the board
        num_grid = [[0 if grid[x, y] in 'v^<>|/-' else 1 for x in range(grid.w)] for y in range(grid.h)]
        
        return num_grid
