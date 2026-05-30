/**
 * This class makes the a creature move
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

import java.awt.Point;
import java.util.Collections;
import java.util.ConcurrentModificationException;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;

public final class IntelCreatureRunnable extends SimpleCreatureRunnable {

    /**
     * The intelligent creature that this Runnable instance belongs to
     */
    private final IntelCreature intelCreature;

    /**
     * If the creature is in the "Observation" When the creature is in this mode
     * it simply acts like an SimpleCreature, intending to observe the world.
     */
    private boolean observe = true;

    /**
     * The constructor
     * 
     * @param intelCreature
     *            The intelligent creature
     * @param grid
     *            The gird of the world
     */
    public IntelCreatureRunnable(IntelCreature intelCreature, Grid grid) {
	super(intelCreature, grid);
	this.intelCreature = intelCreature;
    }

    @Override
    public void run() {

	while (intelCreature.isAlive() && !intelCreature.isAPartner()) {
	    Thread observer = new Thread(new Runnable() {

		    @Override
		    public void run() {
			while (intelCreature.isAlive()
			       && intelCreature.plantsSeen.size() <= 1) {
			    // works only if print out
			    System.out.print("");
			}
			observe = false;
		    }
		});
	    observer.setDaemon(true);
	    observer.start();

	    try {
		while (intelCreature.isAlive() && observe
		       && !intelCreature.isAPartner()) {
		    int acNumber = ra.nextInt(NUM_OF_MOVES);
		    Thread th = new Thread(new Timer(5000));
		    th.start();
		    doAction(acNumber);
		    stop = false;
		    grid.repaint();
		}
	    } catch (InterruptedException e) {
		e.printStackTrace();
	    }

	    System.out.println("Observation finished");
	    WorldFrame.log.append("Intel Creature "
				  + intelCreature.getCreautreNumber()
				  + " Observation finished \n");

	    try {

		doAction();
		grid.repaint();

	    } catch (InterruptedException e) {
		e.printStackTrace();
	    }
	    observe = true;
	}
    }

    /**
     * Do actions
     * 
     * @throws InterruptedException
     */
    private void doAction() throws InterruptedException {
	Plant plant = null;
	Point pPoint = null;
	Point cPoint = null;

	if (intelCreature.isAlive() && intelCreature.plantsSeen.size() > 0) {
	    plant = getNextDesiredPlant(intelCreature, intelCreature.plants,
					intelCreature.plantsSeen, true);

	    if (plant != null) {
		System.out.println("A desired plant found " + plant.getType());
		intelCreature.setDesiredPlant(plant);

		pPoint = plant.getPosition();
		cPoint = intelCreature.getPosition();
	    } else {
		System.out.println("Didnt get the right plant");
		plant = getNextDesiredPlant(intelCreature,
					    intelCreature.plants, intelCreature.plantsSeen, false);
		pPoint = plant.getPosition();
		intelCreature.setDesiredCombo(-1);
		intelCreature.setDesiredPlant(null);
		cPoint = intelCreature.getPosition();
	    }
	}

	while (intelCreature.isAlive() && plant != null && pPoint != null
	       && cPoint != null && intelCreature.plantsSeen.size() > 0
	       && !pPoint.equals(cPoint) && !intelCreature.isAPartner()) {
	    waitIfPossible();
	    if (intelCreature.hasPartner()) {
		intelCreature.getPartner().setPosition(cPoint);
	    }

	    if (intelCreature.hasPartner()) {
		System.out
		    .println("Im moving alive"
			     + intelCreature.isAlive()
			     + " rmovable "
			     + intelCreature.isRightMovable()
			     + " ptaken "
			     + !plant.hasTaken()
			     + " psize "
			     + (intelCreature.plants.size() <= SimpleCreature.PLANT_LIMIT)
			     + " npartner " + !intelCreature.isAPartner());
	    }
	    while (!plant.hasTaken() && intelCreature.isAlive()
		   && !intelCreature.isAPartner()) {
		while (intelCreature.isAlive()
		       && pPoint.getX() > cPoint.getX()
		       && intelCreature.isRightMovable()
		       && !plant.hasTaken()
		       && intelCreature.plants.size() <= SimpleCreature.PLANT_LIMIT
		       && !intelCreature.isAPartner()) {
		    intelCreature.moveRight();

		    if (intelCreature.hasPartner()) {
			intelCreature.getPartner().setPosition(cPoint);
		    }

		    Thread.sleep(DELAY);
		    grid.repaint();
		    pPoint = plant.getPosition();
		    cPoint = intelCreature.getPosition();
		}

		waitIfPossible();

		while (intelCreature.isAlive()
		       && pPoint.getY() > cPoint.getY()
		       && intelCreature.isDownMovable()
		       && !plant.hasTaken()
		       && intelCreature.plants.size() <= SimpleCreature.PLANT_LIMIT
		       && !intelCreature.isAPartner()) {
		    intelCreature.moveDown();

		    if (intelCreature.hasPartner()) {
			intelCreature.getPartner().setPosition(cPoint);
		    }

		    Thread.sleep(DELAY);
		    grid.repaint();
		    pPoint = plant.getPosition();
		    cPoint = intelCreature.getPosition();
		}

		waitIfPossible();

		while (intelCreature.isAlive()
		       && pPoint.getX() < cPoint.getX()
		       && intelCreature.isLeftMovable()
		       && !plant.hasTaken()
		       && intelCreature.plants.size() <= SimpleCreature.PLANT_LIMIT
		       && !intelCreature.isAPartner()) {
		    intelCreature.moveLeft();

		    if (intelCreature.hasPartner()) {
			intelCreature.getPartner().setPosition(cPoint);
		    }
		    Thread.sleep(DELAY);
		    grid.repaint();
		    pPoint = plant.getPosition();
		    cPoint = intelCreature.getPosition();
		}

		waitIfPossible();

		while (intelCreature.isAlive()
		       && intelCreature.isUpMovable()
		       && pPoint.getY() < cPoint.getY()
		       && !plant.hasTaken()
		       && intelCreature.plants.size() <= SimpleCreature.PLANT_LIMIT
		       && !intelCreature.isAPartner()) {
		    intelCreature.moveUp();

		    if (intelCreature.hasPartner()) {
			intelCreature.getPartner().setPosition(cPoint);
		    }

		    Thread.sleep(DELAY);
		    grid.repaint();
		    pPoint = plant.getPosition();
		    cPoint = intelCreature.getPosition();
		}

		waitIfPossible();
	    }
	    synchronized (intelCreature.plantsSeen) {
		List<Plant> pS = Collections
		    .synchronizedList(intelCreature.plantsSeen);

		for (Iterator<Plant> iterator2 = pS.iterator(); iterator2
			 .hasNext();) {
		    try {
			Plant plant2 = iterator2.next();
			if (plant2.hasTaken()) {
			    iterator2.remove();
			}
		    } catch (ConcurrentModificationException e) {
			continue;
		    }
		}
	    }

	    if (intelCreature.isAlive() && intelCreature.plantsSeen.size() > 0) {
		plant = getNextDesiredPlant(intelCreature,
					    intelCreature.plants, intelCreature.plantsSeen, true);

		if (plant != null) {
		    System.out.println("A desired plant found "
				       + plant.getType() + " for "
				       + intelCreature.getDesiredCombo());
		    intelCreature.setDesiredPlant(plant);

		    pPoint = plant.getPosition();
		    cPoint = intelCreature.getPosition();
		} else {
		    System.out.println("Didnt get the right plant");
		    plant = getNextDesiredPlant(intelCreature,
						intelCreature.plants, intelCreature.plantsSeen,
						false);
		    intelCreature.setDesiredCombo(-1);
		    intelCreature.setDesiredPlant(null);
		    pPoint = plant.getPosition();
		    cPoint = intelCreature.getPosition();
		}
	    }
	}
    }

    /**
     * get the most desirable plant according to the best combination. if not
     * return the first plant. And set the desired plant.
     * 
     * @param intelCreature
     *            The creature
     * @param plantsList
     *            The list of plants
     * @param plantsSeen
     *            plants that has been seen
     * @param CreatureInspect
     *            true, if the method has been used when dealing with another
     *            intelligent creature, otherwise false.
     * @return the desired plant
     */
    protected synchronized static Plant getNextDesiredPlant(
							    IntelCreature intelCreature, LinkedList<Plant> plantsList,
							    LinkedList<Plant> plantsSeen, boolean CreatureInspect) {
	int tGreen = 0;
	int tRed = 0;
	int tYellow = 0;
	int tMagenta = 0;

	List<Plant> plants = null;

	synchronized (plantsList) {
	    plants = Collections.synchronizedList(plantsList);

	    for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
		Plant plant = null;
		try {

		    plant = it.next();

		} catch (ConcurrentModificationException e) {
		    // if the plant is not available, move on to the next one
		    continue;
		}

		if (plant.getType() == Plant.GREEN_PLANT) {
		    tGreen++;
		}

		if (plant.getType() == Plant.RED_PLANT) {
		    tRed++;
		}

		if (plant.getType() == Plant.YELLOW_PLANT) {
		    tYellow++;
		}

		if (plant.getType() == Plant.MAGENTA_PLANT) {
		    tMagenta++;
		}

	    }
	}

	synchronized (plantsSeen) {
	    plants = Collections.synchronizedList(plantsSeen);
	    boolean comboSet = false;
	    for (Iterator<Plant> it = plants.iterator(); it.hasNext();) {
		Plant tPlant = null;
		try {
		    tPlant = it.next();
		} catch (ConcurrentModificationException e) {
		    // if the plant is not available, move on to the next one
		    continue;
		}
		if (intelCreature.isInSameSquare(tPlant.getPosition())) {
		    System.out.println("The type of the palant is "
				       + tPlant.getType());

		    if (tPlant.getType() == Plant.GREEN_PLANT && tRed > 0) {

			if (CreatureInspect) {
			    System.out
				.println("The dcombo is set to one and returning1 "
					 + tPlant.getType()
					 + " "
					 + (tPlant.getType() == Plant.GREEN_PLANT));
			    intelCreature
				.setDesiredCombo(SimpleCreature.COMBO_ONE);
			}

			return tPlant;
		    }

		    if (tPlant.getType() == Plant.RED_PLANT
			&& (tGreen > 0 || tYellow > 0)) {

			if (tGreen > 0 && CreatureInspect) {
			    System.out
				.println("The dcombo is set to one and returning2 "
					 + tPlant.getType()
					 + " "
					 + (tPlant.getType() == Plant.RED_PLANT));
			    intelCreature
				.setDesiredCombo(SimpleCreature.COMBO_ONE);
			    comboSet = true;
			}
			if (tYellow > 0 && CreatureInspect && !comboSet) {
			    System.out.println("The dcombo is set to two "
					       + (tPlant.getType() == Plant.RED_PLANT));
			    intelCreature
				.setDesiredCombo(SimpleCreature.COMBO_TWO);
			}
			return tPlant;
		    }

		    if (tPlant.getType() == Plant.YELLOW_PLANT
			&& (tRed > 0 || tMagenta > 0)) {
			if (tRed > 0 && CreatureInspect) {
			    System.out
				.println("The dcombo is set to two  and returning "
					 + (tPlant.getType() == Plant.YELLOW_PLANT));
			    intelCreature
				.setDesiredCombo(SimpleCreature.COMBO_TWO);
			    comboSet = true;
			}
			if (tMagenta > 0 && CreatureInspect && !comboSet) {
			    System.out
				.println("The dcombo is set to three and re "
					 + (tPlant.getType() == Plant.YELLOW_PLANT));
			    intelCreature
				.setDesiredCombo(SimpleCreature.COMBO_THREE);
			}
			return tPlant;
		    }
		    if (tPlant.getType() == Plant.MAGENTA_PLANT && tYellow > 0) {

			if (CreatureInspect) {
			    System.out
				.println("The dcombo is set to three and r "
					 + (tPlant.getType() == Plant.MAGENTA_PLANT));
			    intelCreature
				.setDesiredCombo(SimpleCreature.COMBO_THREE);
			}
			return tPlant;
		    }
		}
	    }

	    if (!CreatureInspect && plants.size() > 0) {
		// else return the last(closest) plant that has been seen
		intelCreature.setDesiredCombo(-1);

		return plants.get(plants.size() - 1);
	    }
	    return null;
	}
    }

    /**
     * Make the intelligent creature wait if possible
     */
    private void waitIfPossible() {

	boolean first = true;
	// move only if it need to
	while (intelCreature.isAlive()
	       && intelCreature.plants.size() == IntelCreature.PLANT_LIMIT) {
	    // loop only works if print out
	    // if (intelCreature.hasPartner())
	    // System.out.println("im waiting " + intelCreature.getEnergy());
	    System.out.println(intelCreature.plants.size() + " im waiting "
			       + intelCreature.getCreautreNumber());
	    if (first) {
		first = false;
		WorldFrame.log.append("Intel Creature "
				      + intelCreature.getCreautreNumber() + " is waiting \n");
	    }
	}
	first = true;
    }

}
