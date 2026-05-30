/**
 * This class has got the attributes and the methods that a simple creature   
 * has. A simple creature may move around in the grid world randomly, by taking
 * random moves for random amounts of times.
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

 * @author Chathura M. Sarathchadra Magurawalage
 *         77.chathura@gmail.com
 *         csarata@essex.ac.uk
 */

package AgentWorld;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.Point;
import java.awt.geom.Rectangle2D;
import java.util.ConcurrentModificationException;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.Vector;

import javax.swing.JComponent;

public class SimpleCreature extends JComponent {
    /**
     * The generated serial ID
     */
    private static final long serialVersionUID = -3847917082797376928L;
    /**
     * The current location of the creature
     */
    protected Point p;
    /**
     * Width of the creature
     */
    protected static final double width = 10;
    /**
     * Height of the creature
     */
    protected static final double height = 10;
    /**
     * The energy left of the creature
     */
    protected int energy = 100;
    /**
     * true if alive, false otherwise.
     */
    protected boolean alive = true;
    /**
     * The plants that the creature carry
     */
    protected final LinkedList<Plant> plants = new LinkedList<Plant>();
    /**
     * The amount of pixels that it travel at a time
     */
    protected final double dr = 1;
    /**
     * The bounds of the grid
     */
    protected static Rectangle2D bounds;

    /**
     * The current square of the creature,
     */
    protected Point currentSquare;

    /**
     * The amount of plants that a simple creature can carry
     */
    protected static int PLANT_LIMIT = 4;

    /**
     * The combination one
     */
    protected final static int COMBO_ONE = 0;
    /**
     * The combination two
     */
    public final static int COMBO_TWO = 1;
    /**
     * The combination three
     */
    public final static int COMBO_THREE = 2;
    /**
     * The limit the creature waits until it eats
     */
    private static final int PLANT_EAT_LIMIT = 50;

    /**
     * The speed that the energy will be consumed
     */
    protected static final long ENERGY_CONS_SPEED = 1000;

    /**
     * The amount of energy that it will loose each time it moves to another
     * square
     */
    private static final int DIFF_SQUARE_ENERGY_CONS_AMOUNT = 7;

    /**
     * The amount of energy that it will loose each time it is in the same
     * square as it is.
     */
    private static final int ENERGY_CONS_AMOUNT = 5;

    /**
     * The combination one utility
     */
    public static int COMBO_ONE_AMOUNT = 450;
    /**
     * The combination two utility
     */
    public static int COMBO_TWO_AMOUNT = 420;
    /**
     * The combination three utility
     */
    public static int COMBO_THREE_AMOUNT = 400;

    /**
     * The amount of creatures
     */
    public static Integer nCreatures = 0;

    /**
     * The creature number
     */
    protected int cNumber;

    /**
     * The Constructor
     * 
     * @param point
     *            - The position of the creature starts moving
     * @param bounds
     *            - The bounds of the grid
     */
    public SimpleCreature(Point point, Rectangle2D bounds) {
	p = point;
	SimpleCreature.bounds = bounds;
	setOpaque(false);
	countEnergy();
	getClosePlants();
	currentSquare = getCurrentSquare(p);
	synchronized (nCreatures) {
	    cNumber = nCreatures = nCreatures + 1;
	}
	WorldFrame.log.append("A new Creature has been added to the world "
			      + getCreautreNumber() + " \n");
    }

    @Override
    public void paintComponent(Graphics g) {
	g.setColor(Color.BLUE);
	g.fillOval((int) p.getX(), (int) p.getY(), (int) width, (int) height);
    }

    /**
     * This method count downs the energy, if the energy goes down '0' the
     * creature dies.
     * 
     * If it is carrying any plants, eat one of them, if the current energy of
     * the creature is less than 50
     */
    protected void countEnergy() {
	Thread timer = new Thread(new Runnable() {

		@Override
		public void run() {
		    while (energy > 0 && isAlive()
			   || (plants.size() > 0 && energy > 0 && isAlive())) {

			if (energy < PLANT_EAT_LIMIT) {

			    if (isCombination(COMBO_ONE)) {
				eatCombinationOne();
			    } else if (isCombination(COMBO_TWO)) {
				eatCombinationTwo();
			    } else if (isCombination(COMBO_THREE)) {
				eatCombinationThree();
			    } else {
				if (plants.size() > 0) {
				    Plant first = plants.poll();
				    WorldFrame.log.append("Simple Creature "
							  + getCreautreNumber()
							  + " ate a plant type of"
							  + first.getType() + " \n");
				    energy += first.getEnergy();
				}
			    }

			}

			try {
			    Thread.sleep(ENERGY_CONS_SPEED);
			} catch (InterruptedException e) {
			    e.printStackTrace();
			}
			// if the creature moves to a different square the energy
			// level goes down more
			if (isSquareChanged()) {
			    energy -= DIFF_SQUARE_ENERGY_CONS_AMOUNT;
			} else {
			    energy -= ENERGY_CONS_AMOUNT;
			}
		    }
		    kill();
		}
	    });
	timer.setDaemon(true);
	timer.start();
    }

    /**
     * Eat the combination three
     */
    protected void eatCombinationThree() {
	int magenta = 0;
	int yellow = 0;
	for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
	    Plant pl = it.next();

	    if (pl.getType() == Plant.MAGENTA_PLANT && magenta < 1) {
		it.remove();
		magenta++;
	    }
	    if (pl.getType() == Plant.YELLOW_PLANT && yellow < 1) {
		it.remove();
		yellow++;
	    }

	    if (magenta == 1 && yellow == 1) {
		break;
	    }
	}
	energy += COMBO_THREE_AMOUNT;
	System.out.println("The combo 3 " + energy);
	WorldFrame.log.append("Simple Creature " + getCreautreNumber()
			      + " ate a combination three  \n");
    }

    /**
     * Eat the combination two
     */
    protected void eatCombinationTwo() {
	int yellow = 0;
	int red = 0;
	for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
	    Plant pl = it.next();

	    if (pl.getType() == Plant.YELLOW_PLANT && yellow < 1) {
		it.remove();
		yellow++;
	    }
	    if (pl.getType() == Plant.RED_PLANT && red < 1) {
		it.remove();
		red++;
	    }

	    // stops looping than required
	    if (yellow == 1 && red == 1) {
		break;
	    }
	}
	energy += COMBO_TWO_AMOUNT;
	System.out.println("The combo 2 " + energy);
	WorldFrame.log.append("Simple Creature " + getCreautreNumber()
			      + " ate a combination two  \n");
    }

    /**
     * Eat the combination one
     */
    protected void eatCombinationOne() {
	int green = 0;
	int red = 0;
	for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
	    Plant pl = it.next();

	    if (pl.getType() == Plant.GREEN_PLANT && green < 1) {
		it.remove();
		green++;
	    }
	    if (pl.getType() == Plant.RED_PLANT && red < 1) {
		it.remove();
		red++;
	    }

	    // stops looping than required
	    if (green == 1 && red == 1) {
		break;
	    }

	}
	energy += COMBO_ONE_AMOUNT;
	System.out.println("The combo 1 " + energy);
	WorldFrame.log.append("Simple Creature " + getCreautreNumber()
			      + " ate a combination one  \n");
    }

    /**
     * Check if there is a possible plant combination in the plants that the
     * creature carry
     * 
     * @param comType
     *            Combination type
     * @return true, if the particular combination exist, false otherwise.
     */
    protected boolean isCombination(int comType) {
	int green = 0;
	int red = 0;
	int yellow = 0;
	switch (comType) {
	case COMBO_ONE:
	    for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
		Plant pl = it.next();

		if (pl.getType() == Plant.GREEN_PLANT && green < 1) {
		    green++;
		}
		if (pl.getType() == Plant.RED_PLANT && red < 1) {
		    red++;
		}

		if (green > 0 && red > 0) {
		    return true;
		}

	    }
	    break;
	case COMBO_TWO:
	    yellow = 0;
	    red = 0;
	    for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
		Plant pl = it.next();

		if (pl.getType() == Plant.YELLOW_PLANT && yellow < 1) {
		    yellow++;
		}
		if (pl.getType() == Plant.RED_PLANT && red < 1) {
		    red++;
		}
		System.out.println("yellow " + yellow + " red " + red);
		if (yellow > 0 && red > 0) {
		    return true;
		}

	    }

	    break;
	case COMBO_THREE:
	    green = 0;
	    yellow = 0;
	    int magenta = 0;
	    for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
		Plant pl = it.next();

		if (pl.getType() == Plant.MAGENTA_PLANT && magenta < 1) {
		    magenta++;
		}
		if (pl.getType() == Plant.YELLOW_PLANT && yellow < 1) {
		    yellow++;
		}

		if (magenta > 0 && yellow > 0) {
		    return true;
		}
	    }
	    break;
	default:
	    break;
	}
	return false;
    }

    /**
     * if the creature has moved to a different square
     * 
     * @return ture, if the creature has changed to a different square, false
     *         otherwise
     */
    protected boolean isSquareChanged() {
	Point cPoint = getCurrentSquare(p);
	if (p.equals(currentSquare)) {
	    return false;
	} else {
	    currentSquare = cPoint;
	}
	return true;
    }

    /**
     * This method finds the closest plant to the creature
     * 
     * If the creature and the plant is in the same square, the creature takes
     * the plant
     */
    protected void getClosePlants() {
	Thread radarThread = new Thread(new Runnable() {
		@SuppressWarnings("unchecked")
		@Override
		public void run() {

		    // True if this creature is alive
		    while (isAlive()) {
			// clone the Grid.plants, the centralised repository of
			// plants, so there will less concurrent conflict
			Vector<Plant> pla;
			synchronized (Grid.plants) {
			    pla = (Vector<Plant>) Grid.plants.clone();

			    for (Iterator<Plant> iterator = pla.iterator(); iterator
				     .hasNext();) {
				Plant plant = iterator.next();

				Point pos = plant.getPosition();
				try {
				    if (isPlantInRange(pos)) {

					if (plants.size() < PLANT_LIMIT) {
					    setPosition(pos);
					    plant.take();
					    plants.add(plant);
					    iterator.remove();

					    synchronized (Grid.plants) {
						// assigns the remaining plants to
						// the
						// main
						// plant repository
						Grid.plants = pla;
					    }
					}
				    }
				} catch (ConcurrentModificationException e2) {
				    continue;
				}
			    }
			}
		    }
		}
	    });
	radarThread.setDaemon(true);
	radarThread.start();
    }

    /**
     * This method finds if the creature is in the same square as the plant
     * given
     * 
     * @param plantPos
     *            - The position of the plant
     * @return - true if it is in the same square as the creature otherwise,
     *         return false.
     * */
    protected boolean isPlantInRange(Point plantPos) {
	Point creaturePosR = getCurrentSquare(p);
	boolean result = false;
	if (plantPos != null) {
	    Point plantPosR = getCurrentSquare(plantPos);
	    result = creaturePosR.equals(plantPosR);
	}
	return result;
    }

    /**
     * Gets the current square of the given position.
     * 
     * @param position
     *            - The current position of the creature / plant
     * @return - The current square.
     */
    protected Point getCurrentSquare(Point position) {
	Point p = new Point();
	p.x = (int) (position.getX() - (position.getX() % 100));
	p.y = (int) (position.getY() - (position.getY() % 100));
	return p;
    }

    /**
     * Current state of the creature
     * 
     * @return - true, if alive, false otherwise
     */
    public boolean isAlive() {
	return alive;
    }

    /**
     * Kills the creature
     */
    public void kill() {
	WorldFrame.log.append("Creature " + getCreautreNumber() + " is dead\n");
	alive = false;
    }

    /**
     * Get the energy that the creature has got left
     * 
     * @return - The remaining energy
     */
    public int getEnergy() {
	return energy;
    }

    /**
     * Check if the creature can move up
     * 
     * @return - true if the creature can move up, otherwise false.
     */
    public boolean isUpMovable() {
	return p.getY() > bounds.getMinY();
    }

    /**
     * Move up
     */
    public void moveUp() {
	p.y -= dr;
    }

    /**
     * Check if the creature can move down
     * 
     * @return - True if the creature can move down, false otherwise
     */
    public boolean isDownMovable() {
	return p.getY() + width <= Grid.BOUND_MAX_Y;
    }

    /**
     * Move down
     */
    public void moveDown() {
	p.y += dr;
    }

    /**
     * Move right
     */
    public void moveRight() {
	p.x += dr;
    }

    /**
     * Check if the creature can move right
     * 
     * @return - true, if the creature can move right, otherwise false.
     */
    public boolean isRightMovable() {
	return p.getX() + width <= Grid.BOUND_MAX_X;
    }

    /**
     * Move left
     */
    public void moveLeft() {
	p.x -= dr;
    }

    /**
     * Move to north east
     */
    public void moveNorthEast() {
	p.x += dr;
	p.y -= dr;
    }

    /**
     * Move to east
     */
    public void moveSouthEast() {
	p.x += dr;
	p.y += dr;
    }

    /**
     * Move to south west
     */
    public void moveSouthWest() {
	p.x -= dr;
	p.y += dr;
    }

    /**
     * Move to north west
     */
    public void moveNorthWest() {
	p.x -= dr;
	p.y -= dr;
    }

    /**
     * Check if the creature can move left
     * 
     * @return - true if the creature can move left, otherwise false.
     */
    public boolean isLeftMovable() {
	return p.getX() > bounds.getMinX();
    }

    /**
     * Sets the current position of the creature
     * 
     * @param plantP
     *            - The position to be set
     */
    protected void setPosition(Point plantP) {
	p = (Point) plantP.clone();
	if (p.getX() >= Grid.BOUND_MAX_X - 20) {
	    p.x = Grid.BOUND_MAX_X - 20;
	}
	if (p.getY() >= Grid.BOUND_MAX_Y - 20) {
	    p.y = Grid.BOUND_MAX_Y - 20;
	}

    }

    /**
     * Get the position of the creature
     * 
     * @return The position
     */
    protected Point getPosition() {
	return p;
    }

    /**
     * Get the unique creature number
     * 
     * @return the creature number
     */
    public int getCreautreNumber() {
	return cNumber;
    }
}
