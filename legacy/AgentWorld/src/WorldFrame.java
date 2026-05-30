/**
 * This class is the world frame that contains the grid agent world that
 * contains the Simple and Intelligent creatures, plants.
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
 * */

package AgentWorld;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.Point;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.geom.Rectangle2D;
import java.util.Random;

import javax.swing.BorderFactory;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSlider;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;

@SuppressWarnings("serial")
public final class WorldFrame extends JFrame {
    /**
     * The width of the frame
     */
    static final int fwidth = 750;

    /**
     * The height of the frame
     */
    static final int fheight = 745;

    /**
     * The width of the grid
     */
    static final int gwidth = 500;

    /**
     * The height of the grid
     */
    static final int gheight = 500;

    /**
     * Intelligent agent number
     */
    static final int INTEL_AGENT = 0;

    /**
     * Simple agent number
     */
    static final int SIMPLE_AGENT = 1;

    /**
     * number of simple creatures in the world
     */
    protected static int nSimpleCreaturesInWorld = 2;

    /**
     * number of intelligent creatures in the world
     */
    protected static int nIntelCreaturesInWorld = 2;

    /**
     * The number of plants in world
     */
    static int nPlantsInWorld = 25;

    /**
     * The log
     */
    protected static JTextArea log = null;

    /**
     * The constructor
     * 
     * @param title
     *            The title
     */
    public WorldFrame(String title) {
	super(title);
	// setResizable(false);
	Container c = getContentPane();
	c.setBackground(new Color(255, 255, 255));

	final Grid grid = new Grid(gwidth, gheight);

	final JSlider plantSlider = new JSlider(JSlider.HORIZONTAL, 0, 25, 25);
	plantSlider.setBorder(BorderFactory
			      .createTitledBorder("Number of Plants"));
	plantSlider.setMajorTickSpacing(5);
	plantSlider.setMinorTickSpacing(1);
	plantSlider.setPaintLabels(true);
	plantSlider.setPaintTicks(true);
	plantSlider.addChangeListener(new ChangeListener() {

		@Override
		public void stateChanged(ChangeEvent arg0) {
		    nPlantsInWorld = plantSlider.getValue();
		    grid.repaint();

		}
	    });
	final JSlider sCreatureSlider = new JSlider(JSlider.HORIZONTAL, 0, 25,
						    2);
	sCreatureSlider.setBorder(BorderFactory
				  .createTitledBorder("Number of Simple Creatures"));
	sCreatureSlider.setMajorTickSpacing(5);
	sCreatureSlider.setMinorTickSpacing(1);
	sCreatureSlider.setPaintLabels(true);
	sCreatureSlider.setPaintTicks(true);
	sCreatureSlider.addChangeListener(new ChangeListener() {

		@Override
		public void stateChanged(ChangeEvent arg0) {
		    nSimpleCreaturesInWorld = sCreatureSlider.getValue();
		    addCreatureToWorld(SIMPLE_AGENT, grid);
		}
	    });

	final JSlider intelCSlider = new JSlider(JSlider.HORIZONTAL, 0, 25, 2);
	intelCSlider.setBorder(BorderFactory
			       .createTitledBorder("Number of Intel Creatures"));
	intelCSlider.setMajorTickSpacing(5);
	intelCSlider.setMinorTickSpacing(1);
	intelCSlider.setPaintLabels(true);
	intelCSlider.setPaintTicks(true);
	intelCSlider.addChangeListener(new ChangeListener() {

		@Override
		public void stateChanged(ChangeEvent arg0) {
		    nIntelCreaturesInWorld = intelCSlider.getValue();
		    addCreatureToWorld(INTEL_AGENT, grid);
		}
	    });

	final JSlider sizeOfWorld = new JSlider(JSlider.HORIZONTAL, 100, 500,
						500);
	sizeOfWorld.setBorder(BorderFactory
			      .createTitledBorder("Size of the world"));
	sizeOfWorld.setMajorTickSpacing(100);
	sizeOfWorld.setPaintLabels(true);
	sizeOfWorld.setPaintTicks(true);
	sizeOfWorld.addChangeListener(new ChangeListener() {

		@Override
		public void stateChanged(ChangeEvent arg0) {
		    Grid.BOUND_MAX_X = sizeOfWorld.getValue();
		    Grid.BOUND_MAX_Y = sizeOfWorld.getValue();
		    grid.clearPlants();
		    grid.repaint();
		}
	    });

	final JSlider numOfPlants = new JSlider(JSlider.HORIZONTAL, 1, 4, 4);
	numOfPlants.setBorder(BorderFactory
			      .createTitledBorder("Type of Plants"));
	numOfPlants.setMajorTickSpacing(1);
	numOfPlants.setPaintLabels(true);
	numOfPlants.setPaintTicks(true);
	numOfPlants.addChangeListener(new ChangeListener() {

		@Override
		public void stateChanged(ChangeEvent arg0) {
		    Plant.NUM_OF_PLANT_TYPES = numOfPlants.getValue();
		    grid.repaint();
		}
	    });

	JPanel gridP = new JPanel();
	grid.setPreferredSize(new Dimension(fwidth, fheight));
	gridP.setOpaque(false);
	gridP.add(grid);

	// check the size of the panel
	gridP.setPreferredSize(new Dimension(fwidth, fheight - 550));
	c.add(gridP, BorderLayout.WEST);
	JPanel controlPanel = new JPanel();
	controlPanel.setPreferredSize(new Dimension(230, 250));
	controlPanel.add(plantSlider);
	controlPanel.add(sCreatureSlider);
	controlPanel.add(intelCSlider);
	controlPanel.add(sizeOfWorld);
	controlPanel.add(numOfPlants);

	JPanel comboText = new JPanel();
	comboText.setPreferredSize(new Dimension(230, 80));
	final JTextField combo1 = new JTextField(4);
	combo1.setText(SimpleCreature.COMBO_ONE_AMOUNT + "");
	combo1.addActionListener(new ActionListener() {

		@Override
		public void actionPerformed(ActionEvent arg0) {
		    SimpleCreature.COMBO_ONE_AMOUNT = Integer.parseInt(combo1
								       .getText());
		}
	    });
	JLabel comboL1 = new JLabel("Combo 1 Amount");
	comboText.add(comboL1);
	comboText.add(combo1);

	final JTextField combo2 = new JTextField(4);
	JLabel comboL2 = new JLabel("Combo 2 Amount");
	combo2.setText(SimpleCreature.COMBO_TWO_AMOUNT + "");
	combo2.addActionListener(new ActionListener() {

		@Override
		public void actionPerformed(ActionEvent arg0) {
		    if (Integer.parseInt(combo2.getText()) < 0) {
			try {
			    throw new Exception("The amount is not valid");
			} catch (Exception e) {
			    e.printStackTrace();
			}
		    }
		    SimpleCreature.COMBO_TWO_AMOUNT = Integer.parseInt(combo2
								       .getText());
		}
	    });
	comboText.add(comboL2);
	comboText.add(combo2);

	final JTextField combo3 = new JTextField(4);
	JLabel comboL3 = new JLabel("Combo 3 Amount");
	combo3.setText(SimpleCreature.COMBO_THREE_AMOUNT + "");
	combo3.addActionListener(new ActionListener() {

		@Override
		public void actionPerformed(ActionEvent arg0) {

		    if (Integer.parseInt(combo3.getText()) < 0) {
			try {
			    throw new Exception("The amount is not valid");
			} catch (Exception e) {
			    e.printStackTrace();
			}
		    }
		    SimpleCreature.COMBO_THREE_AMOUNT = Integer.parseInt(combo3
									 .getText());
		}
	    });
	comboText.add(comboL3);
	comboText.add(combo3);
	controlPanel.add(comboText);

	JLabel nSAgent = new JLabel("Simple Creatures");
	JTextField nSAField = new JTextField(3);
	nSAField.setEditable(false);

	JLabel nIAgent = new JLabel("Intelli. Creatures");
	JTextField nIAField = new JTextField(3);
	nIAField.setEditable(false);

	controlPanel.add(nSAgent);
	controlPanel.add(nSAField);
	controlPanel.add(nIAgent);
	controlPanel.add(nIAField);

	c.add(controlPanel, BorderLayout.EAST);

	JPanel controlPanel2 = new JPanel();
	controlPanel2.setPreferredSize(new Dimension(fwidth, 197));
	JPanel crContorls = new JPanel();
	crContorls.setPreferredSize(new Dimension(290, 95));

	JLabel sl1 = new JLabel("Simple Creature Plant Limit");
	final JTextField nSPL = new JTextField(3);
	nSPL.setText(SimpleCreature.PLANT_LIMIT + "");
	nSPL.addActionListener(new ActionListener() {

		@Override
		public void actionPerformed(ActionEvent arg0) {
		    SimpleCreature.PLANT_LIMIT = Integer.parseInt(nSPL.getText());
		}
	    });

	crContorls.add(sl1);
	crContorls.add(nSPL);

	JLabel il1 = new JLabel("Intel. Creature Plant Limit");
	final JTextField nIPL = new JTextField(3);
	nIPL.setText(IntelCreature.PLANT_LIMIT + "");
	nIPL.addActionListener(new ActionListener() {

		@Override
		public void actionPerformed(ActionEvent arg0) {
		    IntelCreature.PLANT_LIMIT = Integer.parseInt(nIPL.getText());
		}
	    });
	// controlPanel2.add(il1);
	// controlPanel2.add(nIPL);
	crContorls.add(il1);
	crContorls.add(nIPL);

	JLabel il2 = new JLabel("Intel. Creature Plant Memory");
	final JTextField nIPM = new JTextField(3);
	nIPM.setText(IntelCreature.PLANT_MEMORY + "");
	nIPM.addActionListener(new ActionListener() {

		@Override
		public void actionPerformed(ActionEvent arg0) {
		    IntelCreature.PLANT_MEMORY = Integer.parseInt(nIPM.getText());
		}
	    });
	// controlPanel2.add(il2);
	// controlPanel2.add(nIPM);
	crContorls.add(il2);
	crContorls.add(nIPM);

	JLabel il3 = new JLabel("Intel. Creature 'Creature' Memory");
	final JTextField nICM = new JTextField(3);
	nICM.setText(IntelCreature.CREATURE_MEMORY + "");
	nICM.addActionListener(new ActionListener() {

		@Override
		public void actionPerformed(ActionEvent arg0) {
		    IntelCreature.CREATURE_MEMORY = Integer.parseInt(nICM.getText());
		}
	    });
	// controlPanel2.add(il3);
	// controlPanel2.add(nICM);
	crContorls.add(il3);
	crContorls.add(nICM);

	JPanel plantCon = new JPanel();
	plantCon.setPreferredSize(new Dimension(250, 95));
	JLabel gpa = new JLabel("Green Plant Amount");
	final JTextField gpat = new JTextField();
	gpat.setText(Plant.getPlantAmount(Plant.GREEN_PLANT) + "");
	gpat.addActionListener(new ActionListener() {

		@Override
		public void actionPerformed(ActionEvent arg0) {
		    try {
			Plant.setPlantAmount(Plant.GREEN_PLANT,
					     Integer.parseInt(gpat.getText()));
		    } catch (NumberFormatException e) {
			e.printStackTrace();
		    } catch (Exception e) {
			e.printStackTrace();
		    }
		}
	    });
	plantCon.add(gpa);
	plantCon.add(gpat);

	JLabel rpa = new JLabel("Red Plant Amount");
	final JTextField rpat = new JTextField();
	rpat.setText(Plant.getPlantAmount(Plant.RED_PLANT) + "");
	rpat.addActionListener(new ActionListener() {

		@Override
		public void actionPerformed(ActionEvent arg0) {
		    try {
			Plant.setPlantAmount(Plant.RED_PLANT,
					     Integer.parseInt(rpat.getText()));
		    } catch (NumberFormatException e) {
			e.printStackTrace();
		    } catch (Exception e) {
			e.printStackTrace();
		    }
		}
	    });
	plantCon.add(rpa);
	plantCon.add(rpat);

	JLabel ypa = new JLabel("Yellow Plant Amount");
	final JTextField ypat = new JTextField();
	ypat.setText(Plant.getPlantAmount(Plant.YELLOW_PLANT) + "");
	ypat.addActionListener(new ActionListener() {

		@Override
		public void actionPerformed(ActionEvent arg0) {
		    try {
			Plant.setPlantAmount(Plant.YELLOW_PLANT,
					     Integer.parseInt(rpat.getText()));
		    } catch (NumberFormatException e) {
			e.printStackTrace();
		    } catch (Exception e) {
			e.printStackTrace();
		    }
		}
	    });
	plantCon.add(ypa);
	plantCon.add(ypat);

	JLabel mpa = new JLabel("Magenta Plant Amount");
	final JTextField mpat = new JTextField();
	mpat.setText(Plant.getPlantAmount(Plant.MAGENTA_PLANT) + "");
	mpat.addActionListener(new ActionListener() {

		@Override
		public void actionPerformed(ActionEvent arg0) {
		    try {
			Plant.setPlantAmount(Plant.MAGENTA_PLANT,
					     Integer.parseInt(mpat.getText()));
		    } catch (NumberFormatException e) {
			e.printStackTrace();
		    } catch (Exception e) {
			e.printStackTrace();
		    }
		}
	    });
	plantCon.add(mpa);
	plantCon.add(mpat);

	controlPanel2.add(crContorls, BorderLayout.WEST);
	controlPanel2.add(plantCon, BorderLayout.EAST);

	log = new JTextArea(60, 20);
	log.setEditable(false);

	JScrollPane logs = new JScrollPane(log);
	log.append("The world has been started\n");

	logs.setPreferredSize(new Dimension(560, 80));
	controlPanel2.add(logs, BorderLayout.SOUTH);

	c.add(controlPanel2, BorderLayout.SOUTH);

	addCreatureToWorld(SIMPLE_AGENT, grid);
	addCreatureToWorld(INTEL_AGENT, grid);

	setCreaturesN(nSAField, nIAField, grid);

	addPlantsToWorld(grid);
    }

    /**
     * Sets the amounts of creatures on the control panel
     * 
     * @param sAA
     * @param iAA
     * @param g
     */
    public void setCreaturesN(final JTextField sAA, final JTextField iAA,
			      final Grid g) {
	Thread nc = new Thread(new Runnable() {

		@Override
		public void run() {
		    while (true) {
			sAA.setText("" + g.getSimpleCreaturesAmount());
			iAA.setText("" + g.getIntelCreaturesAmount());
		    }
		}
	    });
	nc.setDaemon(true);
	nc.start();
    }

    /**
     * The main method
     * 
     * @param args
     */
    public static void main(String[] args) {
	JFrame frame = new WorldFrame("The AgentWorld");
	frame.setSize(fwidth, fheight);
	frame.setLocation(0, 0);
	frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
	frame.setVisible(true);
    }

    /**
     * Add plants to the world. Make sure there will be a constant amount of
     * plants in the world
     * 
     * @param g
     *            the grid
     */
    public void addPlantsToWorld(final Grid g) {
	Thread plantWatcher = new Thread(new Runnable() {

		@Override
		public void run() {
		    int n = 0;
		    while (true) {

			while (Grid.plants.size() < nPlantsInWorld) {
			    if (nPlantsInWorld - Grid.plants.size() >= 4) {
				n = 4;
			    } else {
				n = nPlantsInWorld - Grid.plants.size();
			    }
			    addPlants(g, n);
			}
		    }
		}
	    });
	plantWatcher.start();
    }

    /**
     * Add a creature to the world
     * 
     * @param creatureType
     *            The type of the creature
     * @param g
     *            the grid world
     */
    public void addCreatureToWorld(final int creatureType, final Grid g) {
	Thread creatureWatcher = new Thread(new Runnable() {

		@Override
		public void run() {
		    Random ra = new Random();

		    if (creatureType == SIMPLE_AGENT) {

			while (g.getSimpleCreaturesAmount() < nSimpleCreaturesInWorld) {
			    // Manage the amount of simple creatures in the
			    // world.if less remove. if more add
			    addCreature(
					g,
					new Point(ra.nextInt(Grid.BOUND_MAX_X - 20), ra
						  .nextInt(Grid.BOUND_MAX_Y - 20)), g
					.getBounds(), creatureType);
			}

			while (g.getSimpleCreaturesAmount() > nSimpleCreaturesInWorld) {
			    g.removeSimpleCreature();
			}
			IntelCreature.CREATURE_MEMORY = nSimpleCreaturesInWorld
			    + nIntelCreaturesInWorld;

		    } else if (creatureType == INTEL_AGENT) {

			while (g.getIntelCreaturesAmount() < nIntelCreaturesInWorld) {
			    // Manage the amount of intelligent creatures in the
			    // world. if less remove. if more add
			    addCreature(
					g,
					new Point(ra.nextInt(Grid.BOUND_MAX_X - 20), ra
						  .nextInt(Grid.BOUND_MAX_Y - 20)), g
					.getBounds(), creatureType);

			}
			while (g.getIntelCreaturesAmount() > nIntelCreaturesInWorld) {
			    g.removeIntelCreature();
			}
		    }
		}
	    });
	creatureWatcher.start();
    }

    /**
     * Adds a creature to the world
     * 
     * @param g
     *            the grid world
     * @param point
     *            the position
     * @param bounds
     *            the bounds
     * @param CreatureType
     *            the type of the creature
     */
    public void addCreature(Grid g, Point point, Rectangle2D bounds,
			    int CreatureType) {
	if (CreatureType == INTEL_AGENT) {
	    // System.out.println("its intel agent");
	    IntelCreature intelCreature = new IntelCreature(point, bounds);
	    g.addCreature(intelCreature);
	    new Thread(new IntelCreatureRunnable(intelCreature, g)).start();

	} else if (CreatureType == SIMPLE_AGENT) {
	    // System.out.println("its simple agent");
	    SimpleCreature simpleCreature = new SimpleCreature(point, bounds);
	    g.addCreature(simpleCreature);
	    new Thread(new SimpleCreatureRunnable(simpleCreature, g)).start();
	}
    }

    /**
     * Add plants to the world
     * 
     * @param g
     *            the grid world
     * @param numOfPlants
     *            the number of plants
     */
    public void addPlants(Grid g, int numOfPlants) {
	PlantSet plantSet = new PlantSet(numOfPlants, new Point(200, 200), g);
	new Thread(new PlantRunnable(plantSet, g)).start();
    }
}
