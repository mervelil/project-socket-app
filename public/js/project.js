// Proje verilerini saklamak için bir dizi oluşturuyoruz
let projects = [];

// Kullanıcı objesi
class User {
  constructor(name) {
    this.name = name;
  }
}

// Proje  objesi
class Project {
  constructor(name, owner, key) {
    this.name = name;
    this.owner = owner;
    this.key = key;
    this.members = [owner]; // Proje sahibi projeye varsayılan olarak dahil
  }

  // Kullanıcıyı projeye eklemek icin
  addUser(user) {
    this.members.push(user);
  }
}

// Yeni bir proje oluşturmak için 
function createProject(name, ownerName) {
  const key = generateKey(); // Tekil anahtar oluşturuluyor
  const owner = new User(ownerName);
  const project = new Project(name, owner, key);
  projects.push(project);
  return key;
}

// Kullanıcıyı projeye dahil etmek için 
function joinProject(projectKey, userName) {
  const project = projects.find(proj => proj.key === projectKey);
  if (project) {
    const user = new User(userName);
    project.addUser(user);
    return true;
  }
  return false; // Proje bulunamadı veya kullanıcı eklenemedi
}

// Kullanıcının dahil olduğu projeleri listeleme fonksiyonu
function listUserProjects(userName) {
  return projects.filter(proj => proj.members.some(member => member.name === userName));
}

// Projeleri listeleme fonksiyonu
function listProjects() {
  return projects.map(proj => ({ name: proj.name, owner: proj.owner.name, key: proj.key }));
}

// Tekil anahtar oluşturma fonksiyonu 
function generateKey() {
  return Math.random().toString(36).substr(2, 10); // Rastgele 10 karakterlik bir anahtar oluşturuluyor
}


const projectKey = createProject("Project Name", "Owner Name");
console.log("Created Project with Key:", projectKey);

joinProject(projectKey, "Member 1");
joinProject(projectKey, "Member 2");

console.log("User Projects:", listUserProjects("Owner Name"));
console.log("All Projects:", listProjects());
