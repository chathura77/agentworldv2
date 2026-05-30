/**
 * The instances of this class, are the plants in the agent world.
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
 * @author Chathura M. Sarathchandra Magurawalage
 *         77.chathura@gmail.com
 *         csarata@essex.ac.uk
 * 
 */

package AgentWorld;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.Point;

import javax.swing.JComponent;

public class Plant extends JComponent {
    /**
     * The green plant number
     */
    public static int GREEN_PLANT = 0;

    /**
     * The read plant number
     */
    public static int RED_PLANT = 1;

    /**
     * The yellow plant number
     */
    public static int YELLOW_PLANT = 2;

    /**
     * The magenta plant number
     */
    public static int MAGENTA_PLANT = 3;

    /**
     * Number of plant types
     */
    public static int NUM_OF_PLANT_TYPES = 4;

    /**
     * The position of the plant
     */
    private Point p;

    /**
     * The width of the plant
     */
    private final int width = 6;

    /**
     * The height of the plant
     */
    private final int height = 6;

    /**
     * The amount of energy of the plant
     */
    private int energy;

    /**
     * true, if the plant has been taken, otherwise false.
     */
    private boolean taken = false;

    /**
     * The plant type.
     */
    private final int plantType;

    /**
     * The amount of energy in green plant
     */
    private static int GREEN_PLANT_AMOUNT = 100;

    /**
     * The amount of energy in red plant
     */
    private static int RED_PLANT_AMOUNT = 50;

    /**
     * The amount of energy in yellow plant
     */
    private static int YELLOW_PLANT_AMOUNT = 70;

    /**
     * The amount of energy in magenta plant
     */
    private static int MAGENTA_PLANT_AMOUNT = 90;

    /**
     * The constructor
     * 
     * @param pType
     *            The type of the plant
     */
    public Plant(int pType) {
	plantType = pType;

	if (plantType == GREEN_PLANT) {
	    energy = 100;
	} else if (plantType == RED_PLANT) {
	    energy = 50;
	} else if (plantType == YELLOW_PLANT) {
	    energy = 70;
	} else if (plantType == MAGENTA_PLANT) {
	    energy = 90;
	} else {
	    energy = 0;
	}
    }

    @Override
    protected void paintComponent(Graphics arg0) {
	if (plantType == GREEN_PLANT) {
	    arg0.setColor(Color.GREEN);
	} else if (plantType == RED_PLANT) {
	    arg0.setColor(Color.RED);
	} else if (plantType == YELLOW_PLANT) {
	    arg0.setColor(Color.YELLOW);
	} else if (plantType == MAGENTA_PLANT) {
	    arg0.setColor(Color.MAGENTA);
	}
	if (p != null) {
	    arg0.fillRect(p.x, p.y, width, height);
	}
    }

    /**
     * Get the type
     * 
     * @return the type of the plant
     */
    public int getType() {
	return plantType;
    }

    /**
     * Set the plant position
     * 
     * @param point
     *            the position
     */
    public void setPosition(Point point) {
	p = point;
    }

    /**
     * Get position
     * 
     * @return the position
     */
    public Point getPosition() {
	return p;
    }

    /**
     * Get the energy of the plant
     * 
     * @return the amount of energy of the plant
     */
    public int getEnergy() {
	return energy;
    }

    /**
     * Creatures call this method to take the plant
     * 
     * @return true, successfully has been taken, false otherwise.
     */
    public synchronized boolean take() {
	return taken = true;
    }

    /**
     * Check if the plant has been taken or not
     * 
     * @return true, if the plant has been taken, false otherwise
     */
    public boolean hasTaken() {
	return taken;
    }

    @Override
    protected Object clone() throws CloneNotSupportedException {
	Plant clone = (Plant) super.clone();
	clone.p = p;
	return clone;
    }

    /**
     * Get the amount of energy of the plant
     * 
     * @param plantType
     *            the type of the plant
     * @return the amount of energy
     */
    public static int getPlantAmount(int plantType) {
	if (plantType == GREEN_PLANT) {
	    return GREEN_PLANT_AMOUNT;
	}
	if (plantType == RED_PLANT) {
	    return RED_PLANT_AMOUNT;
	}
	if (plantType == YELLOW_PLANT) {
	    return YELLOW_PLANT_AMOUNT;
	}
	if (plantType == MAGENTA_PLANT) {
	    return MAGENTA_PLANT_AMOUNT;
	}
	return 0;
    }

    /**
     * Set the amount of energy of the plant
     * 
     * @param plantType
     *            the type of the plant
     * @param amount
     *            the amount of the plant
     * @throws Exception
     *             if the amount is not valid
     */
    public static void setPlantAmount(int plantType, int amount)
	throws Exception {
	if (amount < 0) {
	    throw new Exception("The amount is not valid");
	}

	if (plantType == GREEN_PLANT) {
	    GREEN_PLANT_AMOUNT = amount;
	}
	if (plantType == RED_PLANT) {
	    RED_PLANT_AMOUNT = amount;
	}
	if (plantType == YELLOW_PLANT) {
	    YELLOW_PLANT_AMOUNT = amount;
	}
	if (plantType == MAGENTA_PLANT) {
	    MAGENTA_PLANT_AMOUNT = amount;
	}
    }
}
