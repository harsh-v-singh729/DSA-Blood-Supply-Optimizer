# DSA-Blood-Supply-Optimizer
DSA-based blood supply management system using Graphs, Dijkstra, BFS, DFS, DSU, BST, Greedy Algorithms, and CSV file handling for efficient blood allocation and route optimization.

## Overview:
Blood Supply Network Optimizer is a Data Structures and Algorithms based project that helps manage blood supply between blood banks and hospitals.

The system maintains donors, patients, hospitals, blood banks, and road connections. It uses graph algorithms to find the best delivery routes and efficiently allocate blood units during emergency situations.
The project is built using C++ and demonstrates the practical use of BST, Queue, Graphs, Dijkstra Algorithm, BFS, DFS, DSU, Greedy Algorithms, and File Handling.
## Dashboard Preview
### Main Dashboard
 <img width="1876" height="877" alt="image" src="https://github.com/user-attachments/assets/b9b2601f-114a-4622-a089-e61898a3ba67" />

## Features: 
### 1. Donor Management (BST)

The system stores donor information using a Binary Search Tree (BST).

Features:

* Add new donors
* Search donors by blood group
* Display all donors in sorted order
* Store donor contact information

  <img width="1889" height="881" alt="image" src="https://github.com/user-attachments/assets/babd77db-62e0-4981-866c-51bae3b77c4e" />

### 2. Patient Request Management (Queue)

Patient requests are maintained using a Queue structure.

Features:

* Add patient requests
* Manage emergency blood requirements
* Track requested blood units
* Maintain waiting requests
<img width="1884" height="820" alt="image" src="https://github.com/user-attachments/assets/0e236de4-29d9-41cf-b178-6d9f3deb71b7" />

### 3. Hospital and Blood Bank Network

Hospitals and blood banks are represented as nodes in a graph.

Features:

* Add hospitals
* Add blood banks
* Update stock levels
* Update demand levels
* Delete inactive nodes

<img width="1882" height="964" alt="image" src="https://github.com/user-attachments/assets/efeedb1c-2664-445f-9b1e-052565784c46" />
### 4. Road Network Management

Roads are represented as graph edges.

Features:

* Add roads
* Modify road distances
* Delete roads
* Maintain transportation network
<img width="1871" height="864" alt="image" src="https://github.com/user-attachments/assets/f02747f3-28c0-48fd-b46f-f18ecc932bbd" />

### 5. Shortest Blood Delivery Route (Dijkstra Algorithm)

The system finds the shortest route between blood banks and hospitals.

Benefits:

* Faster blood transportation
* Reduced delivery time
* Better emergency response

<img width="833" height="634" alt="image" src="https://github.com/user-attachments/assets/e663181d-a70d-4eb9-808a-e270f1c8841d" />


### 6. Nearby Hospital Search (BFS)

Breadth First Search is used to find nodes reachable within a given distance.

Benefits:

* Identify nearby hospitals
* Find nearby blood banks
* Improve emergency planning

<img width="653" height="524" alt="image" src="https://github.com/user-attachments/assets/05139815-0db9-4734-be55-bfc2de55dfdd" />

### 7. Network Reachability Check (DFS)

Depth First Search is used to verify whether two locations are connected.

Benefits:

* Detect disconnected nodes
* Check route availability
* Validate network connectivity
<img width="695" height="642" alt="image" src="https://github.com/user-attachments/assets/3797dc86-7a10-405e-a17c-388b61308d02" />

### 8. Blood Allocation System (Greedy Algorithm)

The project uses a Greedy Strategy to allocate blood units from the nearest available blood bank.

Features:

* Match blood group requirements
* Minimize delivery distance
* Improve fulfillment rate
<img width="866" height="275" alt="image" src="https://github.com/user-attachments/assets/ee9718bf-e9b8-47be-ad13-d8fc2c890b1f" />
<img width="1862" height="815" alt="image" src="https://github.com/user-attachments/assets/fb7bf965-0055-46af-9ffb-023eb11a6813" />

### 9. Supply Zone Detection (Disjoint Set Union)

DSU is used to identify connected supply zones.

Benefits:

* Detect connected regions
* Manage large networks
* Improve supply planning
<img width="1599" height="877" alt="image" src="https://github.com/user-attachments/assets/36ff2414-dca7-4d32-9633-543cf77beb51" />

### 10. Topological Supply Order

Topological Sorting is used to generate a possible supply order in the network.

Benefits:

* Understand supply flow
* Organize delivery sequence
* Study network dependencies

<img width="1627" height="268" alt="image" src="https://github.com/user-attachments/assets/75da47a5-a244-488d-af9c-10445064d584" />


### 11. CSV File Handling

The project supports persistent storage using CSV files.

Files:

#### people.csv

Stores:

* Donor records
* Patient records

#### hospitals.csv

Stores:

* Hospital information
* Blood bank information

Features:

* Automatic loading on startup
* Automatic saving of records
* Data persistence
<img width="1427" height="788" alt="image" src="https://github.com/user-attachments/assets/7d26f1d8-f227-4cd4-a419-d53333a75997" />

## Algorithms & Data Structures Used

This project uses multiple Data Structures and Algorithms to efficiently manage blood supply between hospitals and blood banks.

- Binary Search Tree (BST) for donor management
- Queue for patient request handling
- Graph for hospital and blood bank network representation
- Dijkstra Algorithm for shortest blood delivery routes
- Breadth First Search (BFS) for nearby node discovery
- Depth First Search (DFS) for reachability checking
- Greedy Algorithm for blood allocation
- Disjoint Set Union (DSU) for supply zone detection
- Topological Sort for supply order analysis
- CSV File Handling for persistent data storage

---

## How to Run

### Clone the Repository

```bash
git clone https://github.com/your-username/Blood-Supply-Network-Optimizer.git
```

### Compile the Program

```bash
g++ blood_supply.cpp -o blood_supply
```

### Run the Program

```bash
./blood_supply
```

---

## Future Improvements

- Blood group compatibility support
- Real-time GPS integration
- Live hospital updates
- Advanced route optimization
- Web-based deployment
- Real-time emergency notifications

---

## Author

**Harsh Vardhan Singh**

B.Tech Student  
C++ | Data Structures & Algorithms

---

⭐ If you found this project useful, consider giving it a star.



