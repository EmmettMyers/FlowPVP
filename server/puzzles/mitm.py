import random
from collections import defaultdict

T, L, R = range(3)

class Path:
    def __init__(self, steps):
        self.steps = steps

    def xys(self, dx=0, dy=1):
        x, y = 0, 0
        yield (x, y)
        for step in self.steps:
            x, y = x + dx, y + dy
            yield (x, y)
            if step == L:
                dx, dy = -dy, dx
            if step == R:
                dx, dy = dy, -dx
            elif step == T:
                x, y = x + dx, y + dy
                yield (x, y)

    def test(self):
        ps = list(self.xys())
        return len(set(ps)) == len(ps)

    def test_loop(self):
        ps = list(self.xys())
        seen = set(ps)
        return len(ps) == len(seen) or len(ps) == len(seen) + 1 and ps[0] == ps[-1]

    def winding(self):
        return self.steps.count(R) - self.steps.count(L)

    def __repr__(self):
        return ''.join({T: '2', R: 'R', L: 'L'}[x] for x in self.steps)

    def show(self):
        import matplotlib.pyplot as plt
        xs, ys = zip(*self.xys())
        plt.plot(xs, ys)
        plt.axis('scaled')
        plt.show()


def unrotate(x, y, dx, dy):
    while (dx, dy) != (0, 1):
        x, y, dx, dy = -y, x, -dy, dx
    return x, y


class Mitm:
    def __init__(self, lr_price, t_price):
        self.lr_price = lr_price
        self.t_price = t_price
        self.inv = defaultdict(list)
        self.list = []

    def prepare(self, budget):
        dx0, dy0 = 0, 1
        for path, (x, y, dx, dy) in self._good_paths(0, 0, dx0, dy0, budget):
            self.list.append((path, x, y, dx, dy))
            self.inv[x, y, dx, dy].append(path)

    def rand_path(self, xn, yn, dxn, dyn):
        while True:
            path, x, y, dx, dy = random.choice(self.list)
            path2s = self._lookup(dx, dy, xn - x, yn - y, dxn, dyn)
            if path2s:
                path2 = random.choice(path2s)
                joined = Path(path + path2)
                if joined.test():
                    return joined

    def rand_path2(self, xn, yn, dxn, dyn):
        seen = set()
        path = []
        while True:
            seen.clear()
            del path[:]
            x, y, dx, dy = 0, 0, 0, 1
            seen.add((x, y))
            for _ in range(2 * (abs(xn) + abs(yn))):
                step, = random.choices(
                    [L, R, T], [1 / self.lr_price, 1 / self.lr_price, 2 / self.t_price])
                path.append(step)
                x, y = x + dx, y + dy
                if (x, y) in seen:
                    break
                seen.add((x, y))
                if step == L:
                    dx, dy = -dy, dx
                if step == R:
                    dx, dy = dy, -dx
                elif step == T:
                    x, y = x + dx, y + dy
                    if (x, y) in seen:
                        break
                    seen.add((x, y))
                if (x, y) == (xn, yn):
                    return Path(path)
                ends = self._lookup(dx, dy, xn - x, yn - y, dxn, dyn)
                if ends:
                    return Path(tuple(path) + random.choice(ends))

    def rand_loop(self, clock=0):
        while True:
            path, x, y, dx, dy = random.choice(self.list)
            path2s = self._lookup(dx, dy, -x, -y, 0, 1)
            if path2s:
                path2 = random.choice(path2s)
                joined = Path(path + path2)
                if clock and joined.winding() != clock * 4:
                    continue
                if joined.test_loop():
                    return joined

    def _good_paths(self, x, y, dx, dy, budget, seen=None):
        if seen is None:
            seen = set()
        if budget >= 0:
            yield (), (x, y, dx, dy)
        if budget <= 0:
            return
        seen.add((x, y))
        x1, y1 = x + dx, y + dy
        if (x1, y1) not in seen:
            for path, end in self._good_paths(
                    x1, y1, -dy, dx, budget - self.lr_price, seen):
                yield (L,) + path, end
            for path, end in self._good_paths(
                    x1, y1, dy, -dx, budget - self.lr_price, seen):
                yield (R,) + path, end
            seen.add((x1, y1))
            x2, y2 = x1 + dx, y1 + dy
            if (x2, y2) not in seen:
                for path, end in self._good_paths(
                        x2, y2, dx, dy, budget - self.t_price, seen):
                    yield (T,) + path, end
            seen.remove((x1, y1))
        seen.remove((x, y))

    def _lookup(self, dx, dy, xn, yn, dxn, dyn):
        xt, yt = unrotate(xn, yn, dx, dy)
        dxt, dyt = unrotate(dxn, dyn, dx, dy)
        return self.inv[xt, yt, dxt, dyt]


if __name__ == '__main__':
    mitm = Mitm(1, 1)
    mitm.prepare(10)
    for i in range(1):
        mitm.rand_loop().show()
    for i in range(1, 10):
        mitm.rand_path2(i, i, 0, 1).show()
    for i in range(1, 10):
        mitm.rand_path(i, i, 0, 1).show()
