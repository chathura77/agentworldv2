/**
 * This class makes the PlantSet appear on the world.
 *
 *  Copyright (C) 2012 Chathura M. Sarathchandra Magurawalage.
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * @author Chathura M. Sarathchandra Magurawalage.
 *         77.chathura@gmail.com
 *         csarata@essex.ac.uk
 * 
 */

package AgentWorld;

import java.awt.Point;
import java.util.Random;

public final class PlantRunnable implements Runnable {
    /**
     * The plant set
     */
    private final PlantSet plantSet;

    /**
     * The world grid
     */
    private final Grid grid;

    /**
     * The constructor
     * 
     * @param plantSet
     *            the plant set
     * @param grid
     *            the grid of world
     */
    public PlantRunnable(PlantSet plantSet, Grid grid) {
	this.plantSet = plantSet;
	this.grid = grid;
    }

    @Override
    public void run() {
	final Random rand = new Random();
	int x, y;
	// while (true) {
	x = rand.nextInt(Grid.BOUND_MAX_X);
	y = rand.nextInt(Grid.BOUND_MAX_Y);

	plantSet.setPositions(new Point(x, y));
	// try {
	// Thread.sleep(DELAY);
	// } catch (InterruptedException e) {
	// e.printStackTrace();
	// }
	grid.repaint();
	// }
    }
}
