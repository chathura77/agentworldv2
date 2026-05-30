/**
 * This class is the grid of the world. Which has got Simple and Intelligent
 * creatures and the plants.
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

import java.awt.Color;
import java.awt.Graphics;
import java.util.Collections;
import java.util.ConcurrentModificationException;
import java.util.Iterator;
import java.util.List;
import java.util.Vector;

import javax.swing.JPanel;

public final class Grid extends JPanel {

    /**
     * The creatures in the world
     */
    protected static final Vector<SimpleCreature> simpleCreatures = new Vector<SimpleCreature>();

    /**
     * The plants in the plants
     */
    protected static Vector<Plant> plants = new Vector<Plant>();

    /**
     * The X bounds of the grid
     */
    static int BOUND_MAX_X = 500;

    /**
     * The Y bounds of the grid
     */
    static int BOUND_MAX_Y = 500;

    /**
     * The constructor
     * 
     * @param width
     *            The width
     * @param height
     *            The height
     */
    public Grid(int width, int height) {
	setOpaque(false);
	setSize(width, height);
    }

    /**
     * Add a creature to the world
     * 
     * @param c
     *            The creature
     */
    public void addCreature(SimpleCreature c) {
	add(c);
	simpleCreatures.add(c);
	validate();
    }

    /**
     * Get the amount of Simple creatures of the world.
     * 
     * @return The amount of creatures
     */
    public int getSimpleCreaturesAmount() {
	int n = 0;
	synchronized (simpleCreatures) {
	    List<SimpleCreature> sList = Collections
		.synchronizedList(simpleCreatures);
	    for (Iterator<SimpleCreature> it = sList.iterator(); it.hasNext();) {
		SimpleCreature c = it.next();

		if (c.getClass().equals(SimpleCreature.class)) {
		    n++;
		}
	    }
	}
	return n;
    }

    /**
     * The intelligent creatures in the world.
     * 
     * @return the amount of the intelligent creatures
     */
    public int getIntelCreaturesAmount() {
	int n = 0;
	synchronized (simpleCreatures) {
	    List<SimpleCreature> sList = Collections
		.synchronizedList(simpleCreatures);
	    for (Iterator<SimpleCreature> it = sList.iterator(); it.hasNext();) {
		SimpleCreature c = it.next();

		if (c.getClass().equals(IntelCreature.class)) {
		    n++;
		}

	    }
	}
	return n;
    }

    /**
     * remove one simple creature
     */
    public void removeSimpleCreature() {
	synchronized (simpleCreatures) {
	    List<SimpleCreature> sC = Collections
		.synchronizedList(simpleCreatures);

	    for (Iterator<SimpleCreature> it = sC.iterator(); it.hasNext();) {
		SimpleCreature c = it.next();
		if (c.getClass() == SimpleCreature.class) {
		    if (c.isAlive()) {
			c.kill();
			return;
		    }
		}
	    }
	}
    }

    /**
     * Remove an intelligent creature
     */
    public void removeIntelCreature() {
	synchronized (simpleCreatures) {
	    List<SimpleCreature> cList = Collections
		.synchronizedList(simpleCreatures);
	    for (Iterator<SimpleCreature> it = cList.iterator(); it.hasNext();) {
		SimpleCreature c = it.next();
		if (c.getClass() == IntelCreature.class) {
		    if (c.isAlive()) {
			c.kill();
			return;
		    }
		}
	    }
	}
    }

    /**
     * Clear the plants
     */
    public void clearPlants() {
	synchronized (plants) {
	    List<Plant> plantList = Collections.synchronizedList(plants);

	    plantList.removeAll(plantList);
	}
    }

    /**
     * Add a plant to the world
     * 
     * @param plant
     *            the plant
     */
    public void addPlant(Plant plant) {
	add(plant);
	plants.add(plant);
	validate();// update newly added plant to the Container
    }

    @Override
    public void paint(Graphics g) {
	super.paintComponents(g);
	g.setColor(Color.BLACK);

	for (int i = 0; i < BOUND_MAX_X; i += 100) {
	    for (int j = 0; j < BOUND_MAX_Y; j += 100) {
		g.drawRect(i, j, 100, 100);
	    }
	}

	synchronized (simpleCreatures) {
	    List<SimpleCreature> sL = Collections
		.synchronizedList(simpleCreatures);

	    for (Iterator<SimpleCreature> it = sL.iterator(); it.hasNext();) {
		SimpleCreature c = it.next();
		if (!c.isAlive()) {
		    it.remove();
		    continue;
		}

		if (c.isAlive()) {
		    c.paint(g);
		}
	    }
	}

	synchronized (plants) {
	    List<Plant> pL = Collections.synchronizedList(plants);

	    for (Iterator<Plant> it = pL.iterator(); it.hasNext();) {
		Plant plant = null;
		try {
		    plant = it.next();
		} catch (ConcurrentModificationException e) {
		    continue;
		}

		if (plant != null && !plant.hasTaken()) {
		    plant.paint(g);
		}
	    }
	}
    }
}
