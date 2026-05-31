/*
 ═════════════════════════════════════════════════════════════
             Blood Supply Network Optimizer                   
 ═════════════════════════════════════════════════════════════

 
 
*/

#include <bits/stdc++.h>
using namespace std;

// ══════════════════════════════════════════════════════════════
//  SECTION 1 -- Data Structures
// ══════════════════════════════════════════════════════════════

// -- 1a. DSU  (Supply Zones) --
struct DSU {
    vector<int> par, sz;

    explicit DSU(int n) : par(n), sz(n, 1) {
        iota(par.begin(), par.end(), 0);
    }

    int find(int x) {
        return par[x] == x ? x : par[x] = find(par[x]);
    }

    void unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return;
        if (sz[a] < sz[b]) swap(a, b);
        par[b] = a;
        sz[a] += sz[b];
    }

    bool same(int a, int b) { return find(a) == find(b); }
    int  size(int x)        { return sz[find(x)]; }
};

// -- 1b. Node  (Hospital or Blood Bank) --
struct Node {
    string name, type, bloodGrp;
    int    stock, demand;
    bool   alive;

    Node() : stock(0), demand(0), alive(false) {}

    Node(const string& nm, const string& tp,
         const string& bg, int stk, int dmnd)
        : name(nm), type(tp), bloodGrp(bg),
          stock(stk), demand(dmnd), alive(true) {}
};

// -- 1c. Donor  (BST node, sorted by name) --
struct Donor {
    int    id, age, units;
    string name, bloodGrp, phone, city;
};

struct BSTNode {
    Donor    data;
    BSTNode *left, *right;
    explicit BSTNode(const Donor& d)
        : data(d), left(nullptr), right(nullptr) {}
};

// -- 1d. Patient  (held in a queue) --
struct Patient {
    int    id, units;          // units = units required
    string name, bloodGrp, phone, city;
};

// ══════════════════════════════════════════════════════════════
//  SECTION 2 -- BST Operations
// ══════════════════════════════════════════════════════════════

BSTNode* bstInsert(BSTNode* root, const Donor& d) {
    if (!root) return new BSTNode(d);
    if (d.name < root->data.name)
        root->left  = bstInsert(root->left,  d);
    else
        root->right = bstInsert(root->right, d);
    return root;
}

void bstInorder(BSTNode* root, vector<Donor>& out) {
    if (!root) return;
    bstInorder(root->left, out);
    out.push_back(root->data);
    bstInorder(root->right, out);
}

void bstSearch(BSTNode* root, const string& bg, vector<Donor>& out) {
    if (!root) return;
    if (root->data.bloodGrp == bg) out.push_back(root->data);
    bstSearch(root->left,  bg, out);
    bstSearch(root->right, bg, out);
}

// ══════════════════════════════════════════════════════════════
//  SECTION 3 -- Graph
// ══════════════════════════════════════════════════════════════

struct Graph {
    int               total;
    vector<Node>      nodes;
    vector<map<int,int>> adj;   // adj[u][v] = distance in km

    explicit Graph(int n) : total(n), nodes(n), adj(n) {}

    bool ok(int u) const {
        return u >= 0 && u < total && nodes[u].alive;
    }

    vector<int> live() const {
        vector<int> r;
        for (int i = 0; i < total; ++i)
            if (nodes[i].alive) r.push_back(i);
        return r;
    }

    void addNode(int id, const string& nm, const string& tp,
                 const string& bg, int stk, int dmnd) {
        if (id >= total) {
            total = id + 1;
            nodes.resize(total);
            adj.resize(total);
        }
        nodes[id] = Node(nm, tp, bg, stk, dmnd);
    }

    bool addEdge(int u, int v, int dist) {
        if (!ok(u) || !ok(v)) return false;
        adj[u][v] = dist;
        adj[v][u] = dist;
        return true;
    }

    bool deleteEdge(int u, int v) {
        if (adj[u].count(v)) {
            adj[u].erase(v);
            adj[v].erase(u);
            return true;
        }
        return false;
    }

    bool modifyEdge(int u, int v, int nd) {
        if (adj[u].count(v)) {
            adj[u][v] = adj[v][u] = nd;
            return true;
        }
        return false;
    }

    void deleteNode(int id) {
        if (!ok(id)) return;
        nodes[id].alive = false;
        adj[id].clear();
        for (int v = 0; v < total; ++v) adj[v].erase(id);
    }
};

// ══════════════════════════════════════════════════════════════
//  SECTION 4 -- Graph Algorithms
// ══════════════════════════════════════════════════════════════

// -- 4a. Dijkstra --
vector<int> dijkstra(const Graph& g, int src, vector<int>& dist) {
    dist.assign(g.total, INT_MAX);
    vector<int> prev(g.total, -1);
    priority_queue<pair<int,int>,
                   vector<pair<int,int>>,
                   greater<pair<int,int>>> pq;
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
        int d = pq.top().first, u = pq.top().second;
        pq.pop();
        if (!g.ok(u) || d > dist[u]) continue;
        for (const auto& kv : g.adj[u]) {
            int v = kv.first, w = kv.second;
            if (!g.ok(v)) continue;
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                prev[v] = u;
                pq.push({dist[v], v});
            }
        }
    }
    return prev;
}

vector<int> getPath(const vector<int>& prev, int dst) {
    vector<int> path;
    for (int v = dst; v != -1; v = prev[v]) path.push_back(v);
    reverse(path.begin(), path.end());
    return path;
}

// -- 4b. BFS  (nodes reachable within maxDist km) --
vector<pair<int,int>> bfsReachable(const Graph& g,
                                    int src, int maxDist) {
    vector<pair<int,int>> reachable;
    vector<int> dist(g.total, INT_MAX);
    queue<pair<int,int>> q;
    dist[src] = 0;
    q.push({src, 0});
    while (!q.empty()) {
        int u = q.front().first, rem = q.front().second;
        q.pop();
        for (const auto& kv : g.adj[u]) {
            int v = kv.first, w = kv.second;
            if (g.ok(v) && rem + w <= maxDist && dist[v] == INT_MAX) {
                dist[v] = rem + w;
                reachable.push_back({v, rem + w});
                q.push({v, rem + w});
            }
        }
    }
    return reachable;
}

// -- 4c. DFS  (reachability check) --─
bool dfs(const Graph& g, int src, int dst,
         vector<bool>& visited) {
    if (src == dst) return true;
    visited[src] = true;
    for (const auto& kv : g.adj[src]) {
        int v = kv.first;
        if (g.ok(v) && !visited[v] && dfs(g, v, dst, visited))
            return true;
    }
    return false;
}

// -- 4d. Topological Sort --
vector<int> topoSort(const Graph& g) {
    vector<int> indeg(g.total, 0);
    for (int u : g.live())
        for (const auto& kv : g.adj[u])
            if (g.ok(kv.first) && u < kv.first)
                indeg[kv.first]++;

    queue<int> q;
    for (int u : g.live())
        if (indeg[u] == 0) q.push(u);

    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (const auto& kv : g.adj[u])
            if (g.ok(kv.first) && --indeg[kv.first] == 0)
                q.push(kv.first);
    }
    return order;
}

// -- 4e. Greedy Blood Allocation --
void gameTheoryAllocation(Graph& g) {
    cout << "\n=== Greedy Blood Allocation ===\n";
    vector<int> banks, hosps;
    for (int u : g.live()) {
        if (g.nodes[u].type == "bloodbank") banks.push_back(u);
        else                                hosps.push_back(u);
    }
    // Sort hospitals by highest demand first
    sort(hosps.begin(), hosps.end(), [&](int a, int b) {
        return g.nodes[a].demand > g.nodes[b].demand;
    });

    int totalFulfilled = 0, totalDemand = 0;
    for (int h : hosps) {
        if (g.nodes[h].demand <= 0) continue;
        totalDemand += g.nodes[h].demand;
        const string& needed = g.nodes[h].bloodGrp;
        int bestBank = -1, bestDist = INT_MAX;
        vector<int> dist;
        dijkstra(g, h, dist);
        for (int b : banks) {
            if (!g.ok(b)) continue;
            if (g.nodes[b].bloodGrp != needed) continue;
            if (g.nodes[b].stock <= 0) continue;
            if (dist[b] < bestDist) { bestDist = dist[b]; bestBank = b; }
        }
        if (bestBank == -1) {
            cout << "  [UNMET]  " << g.nodes[h].name
                 << " needs " << g.nodes[h].demand
                 << " units of " << needed << " — no bank available\n";
        } else {
            int supply = min(g.nodes[h].demand, g.nodes[bestBank].stock);
            g.nodes[bestBank].stock -= supply;
            g.nodes[h].demand       -= supply;
            totalFulfilled          += supply;
            cout << "  [SUPPLY] " << g.nodes[bestBank].name
                 << " -> " << g.nodes[h].name
                 << " | " << supply << " units of " << needed
                 << " | dist=" << bestDist << " km\n";
        }
    }
    cout << "\n  Total demand   : " << totalDemand    << " units\n";
    cout << "  Total fulfilled: " << totalFulfilled  << " units\n";
    cout << "  Efficiency     : "
         << (totalDemand > 0 ? (totalFulfilled * 100 / totalDemand) : 0)
         << "%\n";
}

// ══════════════════════════════════════════════════════════════
//  SECTION 5 -- CSV Helper Utilities
// ══════════════════════════════════════════════════════════════

// Trim leading/trailing whitespace from a string
static string trim(const string& s) {
    size_t l = s.find_first_not_of(" \t\r\n");
    size_t r = s.find_last_not_of(" \t\r\n");
    if (l == string::npos) return "";
    return s.substr(l, r - l + 1);
}

// Split a CSV line on commas (does not handle quoted fields)
static vector<string> splitCSV(const string& line) {
    vector<string> fields;
    stringstream ss(line);
    string field;
    while (getline(ss, field, ','))
        fields.push_back(trim(field));
    return fields;
}

// ══════════════════════════════════════════════════════════════
//  SECTION 6 -- File I/O
// ══════════════════════════════════════════════════════════════

/*
 * loadPeopleData()
 * ----------------─
 * Expected CSV format (people.csv):
 *   id,name,role,bloodGroup,units,phone,city
 *   role = "donor" | "patient"
 *
 * Donors  → inserted into BST.
 * Patients → pushed into the patient queue.
 */
bool loadPeopleData(const string& filepath,
                    BSTNode*& donorRoot,
                    int& donorIdCtr,
                    queue<Patient>& patientQueue) {
    ifstream fin(filepath);
    if (!fin.is_open()) {
        cerr << "  [WARN] Cannot open '" << filepath
             << "'. Starting with empty people data.\n";
        return false;
    }

    string line;
    int lineNum = 0, loaded = 0;
    // Skip header
    getline(fin, line);
    ++lineNum;

    while (getline(fin, line)) {
        ++lineNum;
        if (trim(line).empty() || line[0] == '#') continue;

        vector<string> f = splitCSV(line);
        if (f.size() < 7) {
            cerr << "  [WARN] people.csv line " << lineNum
                 << ": expected 7 fields, got " << f.size()
                 << " — skipped.\n";
            continue;
        }

        int    id    = stoi(f[0]);
        string name  = f[1];
        string role  = f[2];
        string bg    = f[3];
        int    units = stoi(f[4]);
        string phone = f[5];
        string city  = f[6];

        if (role == "donor") {
            Donor d;
            d.id      = id;
            d.name    = name;
            d.bloodGrp= bg;
            d.units   = units;
            d.phone   = phone;
            d.city    = city;
            d.age     = 0;          // age not in CSV; defaults to 0
            donorRoot = bstInsert(donorRoot, d);
            if (id >= donorIdCtr) donorIdCtr = id + 1;
            ++loaded;
        } else if (role == "patient") {
            Patient p;
            p.id      = id;
            p.name    = name;
            p.bloodGrp= bg;
            p.units   = units;
            p.phone   = phone;
            p.city    = city;
            patientQueue.push(p);
            ++loaded;
        } else {
            cerr << "  [WARN] people.csv line " << lineNum
                 << ": unknown role '" << role << "' — skipped.\n";
        }
    }
    cout << "  [OK] Loaded " << loaded
         << " people records from '" << filepath << "'.\n";
    return true;
}

/*
 * loadHospitalData()
 * ------------------
 * Expected CSV format (hospitals.csv):
 *   id,name,type,bloodGroup,stock,demand
 *   type = "bloodbank" | "hospital"
 *
 * All records are loaded into the Graph.
 */
bool loadHospitalData(const string& filepath, Graph& g) {
    ifstream fin(filepath);
    if (!fin.is_open()) {
        cerr << "  [WARN] Cannot open '" << filepath
             << "'. Using hardcoded graph nodes only.\n";
        return false;
    }

    string line;
    int lineNum = 0, loaded = 0;
    // Skip header
    getline(fin, line);
    ++lineNum;

    while (getline(fin, line)) {
        ++lineNum;
        if (trim(line).empty() || line[0] == '#') continue;

        vector<string> f = splitCSV(line);
        if (f.size() < 6) {
            cerr << "  [WARN] hospitals.csv line " << lineNum
                 << ": expected 6 fields, got " << f.size()
                 << " — skipped.\n";
            continue;
        }

        int    id     = stoi(f[0]);
        string name   = f[1];
        string type   = f[2];
        string bg     = f[3];
        int    stock  = stoi(f[4]);
        int    demand = stoi(f[5]);

        g.addNode(id, name, type, bg, stock, demand);
        ++loaded;
    }
    cout << "  [OK] Loaded " << loaded
         << " hospital/bank records from '" << filepath << "'.\n";
    return true;
}

/*
 * savePeopleData()
 * ----------------
 * Writes current BST donors + patient queue to people.csv.
 * The queue is non-destructive (rebuilt after iteration).
 */
bool savePeopleData(const string& filepath,
                    BSTNode* donorRoot,
                    queue<Patient> patientQueue) { // passed by value → safe copy
    ofstream fout(filepath);
    if (!fout.is_open()) {
        cerr << "  [ERROR] Cannot write to '" << filepath << "'.\n";
        return false;
    }

    fout << "id,name,role,bloodGroup,units,phone,city\n";

    // Donors from BST inorder
    vector<Donor> donors;
    bstInorder(donorRoot, donors);
    for (const Donor& d : donors)
        fout << d.id << ',' << d.name << ",donor,"
             << d.bloodGrp << ',' << d.units << ','
             << d.phone << ',' << d.city << '\n';

    // Patients from queue copy
    while (!patientQueue.empty()) {
        const Patient& p = patientQueue.front();
        fout << p.id << ',' << p.name << ",patient,"
             << p.bloodGrp << ',' << p.units << ','
             << p.phone << ',' << p.city << '\n';
        patientQueue.pop();
    }

    cout << "  [OK] People data saved to '" << filepath << "'.\n";
    return true;
}

/*
 * saveHospitalData()
 * ------------------
 * Writes all live graph nodes to hospitals.csv.
 * Road network is NOT saved (remains semi-hardcoded per spec).
 */
bool saveHospitalData(const string& filepath, const Graph& g) {
    ofstream fout(filepath);
    if (!fout.is_open()) {
        cerr << "  [ERROR] Cannot write to '" << filepath << "'.\n";
        return false;
    }

    fout << "id,name,type,bloodGroup,stock,demand\n";
    for (int u : g.live()) {
        const Node& n = g.nodes[u];
        fout << u << ',' << n.name << ',' << n.type << ','
             << n.bloodGrp << ',' << n.stock << ',' << n.demand << '\n';
    }
    cout << "  [OK] Hospital data saved to '" << filepath << "'.\n";
    return true;
}

// ══════════════════════════════════════════════════════════════
//  SECTION 7 -- Display Helpers
// ══════════════════════════════════════════════════════════════

static void sep() { cout << string(56, '-') << '\n'; }

static void listNodes(const Graph& g) {
    cout << "\n  ID   Name                   Type        Blood   Stock  Demand\n";
    sep();
    for (int u : g.live()) {
        const Node& n = g.nodes[u];
        printf("  %-4d %-22s %-10s %-7s %-6d %d\n",
               u, n.name.c_str(), n.type.c_str(),
               n.bloodGrp.c_str(), n.stock, n.demand);
    }
    cout << '\n';
}

static int pickNode(const Graph& g, const string& prompt) {
    listNodes(g);
    int id;
    cout << prompt;
    cin >> id;
    if (!g.ok(id)) { cout << "  [!] Invalid node id.\n"; return -1; }
    return id;
}

static void displayPatientQueue(const queue<Patient>& pq) {
    if (pq.empty()) {
        cout << "  No patients in queue.\n";
        return;
    }
    cout << "\n  Patient Queue (" << pq.size() << " patients):\n";
    cout << "  ID   Name                   Blood   Units  Phone          City\n";
    sep();
    queue<Patient> tmp = pq;          // non-destructive copy
    while (!tmp.empty()) {
        const Patient& p = tmp.front(); tmp.pop();
        printf("  %-4d %-22s %-7s %-6d %-14s %s\n",
               p.id, p.name.c_str(), p.bloodGrp.c_str(),
               p.units, p.phone.c_str(), p.city.c_str());
    }
    cout << '\n';
}

// ══════════════════════════════════════════════════════════════
//  SECTION 8 -- Graph Initialisation  (semi-hardcoded roads)
// ══════════════════════════════════════════════════════════════

static void initGraph(Graph& g) {
    // Nodes — overwritten by hospitals.csv if present; these serve as
    // fallback defaults so the system always has a working network.
    g.addNode(0, "Jeevan Dhara Blood Bank",   "bloodbank", "A+",  50,  0);
    g.addNode(1, "Raktdaan Seva Kendra",  "bloodbank", "B+",  30,  0);
    g.addNode(2, "Sanjeevani Blood Bank",  "bloodbank", "O+",  40,  0);
    g.addNode(3, "Jeevan Jyoti Blood Bank",   "bloodbank", "AB+", 20,  0);
    g.addNode(4, "Apollo Hospitals Noida",    "hospital",  "A+",   0, 15);
    g.addNode(5, "Fortis Hospital Noida",   "hospital",  "B+",   0, 10);
    g.addNode(6, "Max Hospital",   "hospital",  "O+",   0, 20);
    g.addNode(7, "Yatharth Super Speciality Hospital",    "hospital",  "AB+",  0,  8);
    g.addNode(8, "Jaypee hospital", "hospital",  "A+",   0, 12);

    // Roads — always hardcoded; modified at runtime via menu option 12
    g.addEdge(0, 4,  5);  g.addEdge(0, 8,  8);
    g.addEdge(1, 5,  4);  g.addEdge(1, 8, 10);
    g.addEdge(2, 6,  3);  g.addEdge(2, 4, 12);
    g.addEdge(3, 7,  6);  g.addEdge(3, 8,  9);
    g.addEdge(4, 5,  7);  g.addEdge(5, 6,  5);
    g.addEdge(6, 7,  8);  g.addEdge(7, 8,  4);
}

// ══════════════════════════════════════════════════════════════
//  SECTION 9 -- Menu Banner
// ══════════════════════════════════════════════════════════════

static void printMenu() {
    cout << "                                                 \n";
    cout << "                                                 \n";
    cout << "          BLOOD SUPPLY NETWORK OPTIMIZER         \n";
    cout << "                                                 \n";
    cout << "     DONOR / PATIENT                             \n";
    cout << "      1.  Add New Donor (BST)                    \n";
    cout << "      2.  Search Donors by Blood Group           \n";
    cout << "      3.  List All Donors (Inorder BST)          \n";
    cout << "      4.  Add Patient Request                    \n";
    cout << "     NETWORK ALGORITHMS                          \n";
    cout << "      5.  Process Urgent Request (Greedy)        \n";
    cout << "      6.  Find Delivery Route (Dijkstra)         \n";
    cout << "      7.  BFS - Nodes within N km                \n";
    cout << "      8.  DFS - Check Reachability               \n";
    cout << "      9.  Show All Nodes & Roads                 \n";
    cout << "     GRAPH MANAGEMENT                            \n";
    cout << "     10.  Add New Hospital / Blood Bank Node     \n";
    cout << "     11.  Delete a Node                          \n";
    cout << "     12.  Add / Modify / Delete a Road           \n";
    cout << "     13.  Update Stock or Demand                 \n";
    cout << "     ANALYSIS                                    \n";
    cout << "     14.  Topological Supply Order               \n";
    cout << "     15.  Show Supply Zones (DSU)                \n";
    cout << "     FILE I/O                                    \n";
    cout << "     16.  Display Patient Queue                  \n";
    cout << "     17.  Load Data From Files                   \n";
    cout << "     18.  Save Current Data To Files             \n";
    cout << "      0.  Exit                                   \n";
    cout << "                                                 \n";
    cout << "  Enter choice: ";
}

// ══════════════════════════════════════════════════════════════
//  SECTION 10 -- Main
// ══════════════════════════════════════════════════════════════

int main() {

    // -- Initialise graph with hardcoded fallback nodes/roads --
    Graph g(10);
    initGraph(g);

    // -- Donor BST and patient queue --
    BSTNode*     donorRoot    = nullptr;
    int          donorIdCtr   = 1;
    queue<Patient> patientQueue;
    int          patientIdCtr = 1;   // used when adding patients manually

    // File paths (relative to working directory)
    const string PEOPLE_FILE    = "people.csv";
    const string HOSPITALS_FILE = "hospitals.csv";

    // -- Startup: load CSV files automatically --
    cout << "\n  Loading data from CSV files...\n";
    loadHospitalData(HOSPITALS_FILE, g);
    loadPeopleData(PEOPLE_FILE, donorRoot, donorIdCtr, patientQueue);

    // -- Main event loop --─
    int choice;
    do
    {
        printMenu();
        cin>>choice; 
        if(cin.fail()){
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "  [!] Please enter a number.\n";
            continue;
        }
        switch (choice) {
        // -- 1. Add Donor --
        case 1: {
            Donor d;
            d.id = donorIdCtr++;
            cout << "  Donor name    : "; cin.ignore(); getline(cin, d.name);
            cout << "  Blood group   : "; cin>>d.bloodGrp;
            cout << "  Age           : "; cin>>d.age;
            cout << "  Units donated : "; cin>>d.units;
            cout << "  Phone         : "; cin.ignore(); getline(cin, d.phone);
            cout << "  City          : "; cin.ignore(); getline(cin, d.city);
            donorRoot = bstInsert(donorRoot, d);
            cout << "  [OK] Donor '" << d.name << "' added (ID " << d.id << ").\n";
            break;
        }

        // -- 2. Search Donors by Blood Group --
        case 2: {
            string bg;
            cout << "  Enter blood group (e.g. A+, O-, AB+): ";
            cin >> bg;
            vector<Donor> found;
            bstSearch(donorRoot, bg, found);
            if (found.empty()) {
                cout << "  No donors found for blood group " << bg << ".\n";
            } else {
                cout << "\n  ID   Name                   Blood  Age  Units  Phone          City\n";
                sep();
                for (const Donor& d : found)
                    printf("  %-4d %-22s %-6s %-4d %-6d %-14s %s\n",
                           d.id, d.name.c_str(), d.bloodGrp.c_str(),
                           d.age, d.units, d.phone.c_str(), d.city.c_str());
            }
            break;
        }

        // -- 3. List All Donors (Inorder) --
        case 3: {
            vector<Donor> all;
            bstInorder(donorRoot, all);
            if (all.empty()) {
                cout << "  No donors registered yet.\n";
            } else {
                cout << "\n  ID   Name                   Blood  Age  Units  Phone          City\n";
                sep();
                for (const Donor& d : all)
                    printf("  %-4d %-22s %-6s %-4d %-6d %-14s %s\n",
                           d.id, d.name.c_str(), d.bloodGrp.c_str(),
                           d.age, d.units, d.phone.c_str(), d.city.c_str());
            }
            break;
        }

        // -- 4. Add Patient Request --
        case 4: {
            Patient p;
            p.id = patientIdCtr++;
            cin.ignore();
            cout<<"  Patient name  : "; getline(cin, p.name);
            cout<< "  Blood group   : "; cin >> p.bloodGrp;
            cout<< "  Units needed  : "; cin >> p.units;
            cin.ignore();
            cout<< "  Phone         : "; getline(cin, p.phone);
            cout<< "  City          : "; getline(cin, p.city);
            
            // Also record demand on the nearest matching hospital (optional)
            int hospId;
            listNodes(g);
            cout << "  Assign to hospital ID (or -1 to skip): ";
            cin>>hospId;
            if (hospId != -1 && g.ok(hospId) && g.nodes[hospId].type == "hospital"){
                g.nodes[hospId].demand += p.units;
                cout << "  [OK] " << g.nodes[hospId].name
                     << " demand updated to " << g.nodes[hospId].demand << " units.\n";
            }
        
            patientQueue.push(p);
            cout << "  [OK] Patient '" << p.name << "' added to queue (ID " << p.id << ").\n";
            break;
        }

        // -- 5. Process Urgent Request (Greedy) -- 
        case 5: {
            gameTheoryAllocation(g);
            break;
        }

        // -- 6. Find Delivery Route (Dijkstra) --
        case 6: {
            int src = pickNode(g, "  Enter SOURCE node ID (blood bank): ");
            if (src == -1) continue;
            int dst = pickNode(g, "  Enter DEST   node ID (hospital)  : ");
            if (dst == -1) continue;
            vector<int> dist;
            vector<int> prev = dijkstra(g, src, dist);
            if (dist[dst] == INT_MAX) {
                cout << "  [!] No path exists between these nodes.\n";
            } else {
                vector<int> path = getPath(prev, dst);
                cout << "\n  Shortest path (" << dist[dst] << " km):\n  ";
                for (int i = 0; i < (int)path.size(); ++i){
                    cout << g.nodes[path[i]].name;
                    if (i + 1 < (int)path.size())
                        cout << " --(" << g.adj[path[i]].at(path[i+1]) << " km)--> ";
                }
                cout << '\n';
            }
            break;
        }

        // -- 7. BFS — Nodes within N km --
        case 7: {
            int src = pickNode(g, "  Enter SOURCE node ID: ");
            if (src == -1) continue;
            int maxD;
            cout << "  Max distance (km): "; cin >> maxD;
            auto nearby = bfsReachable(g, src, maxD);
            if (nearby.empty()) {
                cout << "  No other nodes reachable within " << maxD << " km.\n";
            } else {
                cout << "\n  Nodes reachable from " << g.nodes[src].name
                     << " within " << maxD << " km:\n";
                for (const auto& p : nearby)
                    cout << "    [" << p.first << "] " << g.nodes[p.first].name
                         << "  (" << p.second << " km)\n";
            }
            break;
        }

        // -- 8. DFS — Check Reachability --
        case 8: {
            int src = pickNode(g, "  Enter SOURCE node ID: ");
            if (src == -1) continue;
            int dst = pickNode(g, "  Enter DEST   node ID: ");
            if (dst == -1) continue;
            vector<bool> visited(g.total, false);
            bool reach = dfs(g, src, dst, visited);
            cout << "\n  " << g.nodes[src].name << " -> " << g.nodes[dst].name
                 << " : " << (reach ? "REACHABLE (path exists)"
                                    : "NOT reachable") << '\n';
            break;
        }

        // -- 9. Show All Nodes & Roads --
        case 9: {
            cout << "\n--- Nodes ---\n";
            listNodes(g);
            cout << "--- Roads ---\n";
            set<pair<int,int>> printed;
            for (int u : g.live()) {
                for (const auto& kv : g.adj[u]) {
                    int v = kv.first, w = kv.second;
                    auto edge = make_pair(min(u,v), max(u,v));
                    if (!printed.count(edge)) {
                        printed.insert(edge);
                        cout << "  [" << u << "] " << g.nodes[u].name
                             << " <--" << w << " km--> "
                             << "[" << v << "] " << g.nodes[v].name << '\n';
                    }
                }
            }
            cout << '\n';
            break;
        }

        // -- 10. Add New Node --
        case 10: {
            string name, type, bg;
            int stock, demand;
            cin.ignore();
            cout << "  Node name                      : "; getline(cin, name);
            cout << "  Type (hospital / bloodbank)    : "; cin >> type;
            cout << "  Blood group (A+/B-/O+/AB+ etc.): "; cin >> bg;
            cout << "  Stock  (0 for hospital)        : "; cin >> stock;
            cout << "  Demand (0 for blood bank)      : "; cin >> demand;
            int newId = g.total;
            g.addNode(newId, name, type, bg, stock, demand);
            cout << "  [OK] Node '" << name << "' added with ID " << newId << ".\n";
            cout << "  Use option 12 to connect roads to it.\n";
            break;
        }

        // -- 11. Delete a Node --
        case 11: {
            int id = pickNode(g, "  Enter node ID to delete: ");
            if (id == -1) continue;
            string confirm;
            cout << "  Delete '" << g.nodes[id].name << "'? (yes/no): ";
            cin >> confirm;
            if (confirm == "yes") {
                g.deleteNode(id);
                cout << "  [OK] Node deleted.\n";
            } else {
                cout << "  Cancelled.\n";
            }
            break;
        }

        // -- 12. Add / Modify / Delete Road --
        case 12: {
            cout << "\n  Road options:\n";
            cout << "   a. Add road\n";
            cout << "   b. Modify road distance\n";
            cout << "   c. Delete road\n";
            cout << "  Choice (a/b/c): ";
            char sub; cin >> sub;

            if (sub == 'a') {
                int u = pickNode(g, "  From node ID: "); if (u == -1) continue;
                int v = pickNode(g, "  To   node ID: "); if (v == -1) continue;
                int dist; cout << "  Distance (km): "; cin >> dist;
                if (g.addEdge(u, v, dist))
                    cout << "  [OK] Road added: " << g.nodes[u].name
                         << " <-> " << g.nodes[v].name
                         << " (" << dist << " km)\n";
                else
                    cout << "  [!] Could not add road.\n";
                }  
                else if (sub == 'b') {
                int u = pickNode(g, "  From node ID: "); 
                if (u == -1) continue;
                int v = pickNode(g, "  To   node ID: ");
                if (v == -1) continue;
                int dist; cout << "  New distance (km): "; cin >> dist;
                if (g.modifyEdge(u, v, dist))
                    cout << "  [OK] Road updated.\n";
                else
                    cout << "  [!] Road does not exist between those nodes.\n";
                } 
                else if (sub == 'c') {
                int u = pickNode(g, "  From node ID: "); if (u == -1) continue;
                int v = pickNode(g, "  To   node ID: "); if (v == -1) continue;
                if (g.deleteEdge(u, v))
                    cout << "  [OK] Road deleted.\n";
                else
                    cout << "  [!] Road not found.\n";
                } 
                else {
                cout << "  [!] Unknown sub-option.\n";
                }
                break;
        }

        // -- 13. Update Stock or Demand --
        case 13: {
            int id = pickNode(g, "  Enter node ID to update: ");
            if (id == -1) continue;
            int stk, dmnd;
            cout << "  New stock  (current=" << g.nodes[id].stock  << "): "; cin >> stk;
            cout << "  New demand (current=" << g.nodes[id].demand << "): "; cin >> dmnd;
            g.nodes[id].stock  = stk;
            g.nodes[id].demand = dmnd;
            cout << "  [OK] Updated " << g.nodes[id].name
                 << " → stock=" << stk << "  demand=" << dmnd << '\n';
            break;
        }

        // -- 14. Topological Supply Order 
        case 14: {
            vector<int> order = topoSort(g);
            cout << "\n  Topological supply order:\n  ";
            for (int u : order) cout << g.nodes[u].name << " -> ";
            cout << "END\n";
            break;
        }

        // -- 15. Supply Zones (DSU) --
        case 15: {
            int maxId = g.total + 5;
            DSU dsu(maxId);
            for (int u : g.live())
                for (const auto& kv : g.adj[u])
                    if (g.ok(kv.first)) dsu.unite(u, kv.first);

            map<int, vector<int>> zones;
            for (int u : g.live()) zones[dsu.find(u)].push_back(u);

            cout << "\n  Supply Zones:\n";
            int zoneNum = 1;
            for (auto& kv : zones) {
                cout << "\n  Zone " << zoneNum++ << " ("
                     << kv.second.size() << " nodes):\n";
                for (int u : kv.second)
                    cout << "    [" << u << "] " << g.nodes[u].name
                         << " (" << g.nodes[u].type << ")\n";
            }
            break;
        }

        // -- 16. Display Patient Queue --
        case 16: {
            displayPatientQueue(patientQueue);
            break;
        }

        // -- 17. Load Data From Files --
        case 17: {
            cout << "\n  Reloading data (existing data cleared)...\n";
            // Reset to avoid duplicates on repeated loads
            donorRoot    = nullptr;
            donorIdCtr   = 1;
            patientQueue = queue<Patient>();
            loadHospitalData(HOSPITALS_FILE, g);
            loadPeopleData(PEOPLE_FILE, donorRoot, donorIdCtr, patientQueue);
            break;
        }

        // -- 18. Save Current Data To Files --
        case 18: {
            cout << "\n  Saving data to CSV files...\n";
            savePeopleData(PEOPLE_FILE, donorRoot, patientQueue);
            saveHospitalData(HOSPITALS_FILE, g);
            break;
        }
        // -- 0. Exit --
        case 0: {
            cout << "\n  Auto-saving before exit...\n";
            savePeopleData(PEOPLE_FILE, donorRoot, patientQueue);
            saveHospitalData(HOSPITALS_FILE, g);
            cout << "\n  Goodbye!\n\n";
            break;
        }

        default: 
            cout << "  [!] Invalid choice. Please enter 0-18.\n";
    }  
    } while(choice != 0);

    return 0;
}