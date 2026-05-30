/***
 * The class's instances contains a set of plants
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
 * */

package AgentWorld;

import java.awt.Graphics;
import java.awt.Point;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.Random;

import javax.swing.JComponent;

public final class PlantSet extends JComponent {
    /**
     * Number of plants.
     */
    private final int plantCount;

    /**
     * The plants.
     */
    private final LinkedList<Plant> plants = new LinkedList<Plant>();
    /**
     * The agent world.
     */
    private final Grid grid;

    /**
     * The constructor
     * 
     * @param numOfPlants
     *            the number of plants that contains the plant set
     * @param point
     *            the position
     * @param g
     *            the agent world grid.
     */
    public PlantSet(int numOfPlants, Point point, Grid g) {
	plantCount = numOfPlants;
	grid = g;
	populatePlants();

	setPositions(point);
    }

    /**
     * Populate the plant set
     */
    private void populatePlants() {
	Random ra = new Random();
	Plant plant;
	for (int i = 0; i < plantCount; i++) {
	    int n = ra.nextInt(Plant.NUM_OF_PLANT_TYPES + 1);

	    if (n == 0) {
		++n;
	    }
	    switch (n) {
	    case 1:
		plant = new Plant(Plant.GREEN_PLANT);
		plants.add(plant);
		grid.addPlant(plant);
		break;
	    case 2:
		plant = new Plant(Plant.YELLOW_PLANT);
		plants.add(plant);
		grid.addPlant(plant);
		break;
	    case 3:
		plant = new Plant(Plant.MAGENTA_PLANT);
		plants.add(plant);
		grid.addPlant(plant);
		break;
	    case 4:
		plant = new Plant(Plant.RED_PLANT);
		plants.add(plant);
		grid.addPlant(plant);
		break;
	    default:
		break;
	    }
	}
    }

    /**
     * Set the positions of the plants
     * 
     * @param position
     *            the position of the plant set
     */
    public void setPositions(Point position) {
	int count = 0;
	for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
	    Plant plant = it.next();

	    int x = (int) position.getX() + (count + 20);
	    int y = (int) position.getY() + (count + 20);

	    if (x > Grid.BOUND_MAX_X - 10) {
		x = Grid.BOUND_MAX_X - 10;
	    }
	    if (y > Grid.BOUND_MAX_Y - 10) {
		y = Grid.BOUND_MAX_Y - 10;
	    }

	    plant.setPosition(new Point(x, y));
	    count += 10;
	}
    }

    @Override
    protected void paintComponent(Graphics g) {
	super.paintComponent(g);
	for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
	    Plant plant = it.next();
	    plant.paint(g);
	}
    }
}
