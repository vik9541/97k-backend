# PHASE 10: iOS Implementation Guide

**Apple Contacts Integration для 97k CRM**

---

## 🎯 Цель

Создать iOS приложение (SwiftUI), которое синхронизирует контакты из Apple Contacts с 97k backend.

**Backend Status**: ✅ **ГОТОВ** (5 API endpoints, тесты проходят)  
**iOS Status**: 📋 **СЛЕДУЮЩИЙ ШАГ**

---

## 📋 Требования

- **Xcode**: 15.0+
- **iOS**: 16.0+
- **Swift**: 5.9+
- **Frameworks**:
  - SwiftUI
  - Contacts (CNContactStore)
  - Foundation

---

## 🚀 Быстрый Старт

### Шаг 1: Создать iOS Проект

```bash
# В Xcode:
File → New → Project
iOS → App
Product Name: 97kCRM
Interface: SwiftUI
Language: Swift
```

### Шаг 2: Добавить Permissions

**Info.plist**:
```xml
<key>NSContactsUsageDescription</key>
<string>97k CRM needs access to sync your contacts</string>
```

### Шаг 3: Создать ContactsManager

**Файл**: `ContactsManager.swift`

```swift
import Foundation
import Contacts

class ContactsManager: ObservableObject {
    @Published var syncStatus: SyncStatus = .notConnected
    @Published var lastSyncDate: Date?
    @Published var totalSynced: Int = 0
    
    private let contactStore = CNContactStore()
    private let apiBaseURL = "https://api.97k.ru" // Production
    private var authToken: String?
    
    enum SyncStatus {
        case notConnected
        case syncing
        case synced
        case error(String)
    }
    
    // MARK: - Authorization
    
    func requestAccess() async throws {
        let granted = try await contactStore.requestAccess(for: .contacts)
        if !granted {
            throw ContactsError.accessDenied
        }
    }
    
    // MARK: - Sync
    
    func syncContacts(authToken: String) async throws {
        self.authToken = authToken
        
        DispatchQueue.main.async {
            self.syncStatus = .syncing
        }
        
        // Fetch contacts
        let contacts = try await fetchAllContacts()
        
        // Send to backend
        let syncDTO = SyncContactsDTO(
            contacts: contacts,
            syncToken: nil,
            isFullSync: true
        )
        
        let result = try await sendSyncRequest(syncDTO)
        
        DispatchQueue.main.async {
            self.syncStatus = .synced
            self.lastSyncDate = Date()
            self.totalSynced = result.created + result.updated
        }
    }
    
    // MARK: - Private
    
    private func fetchAllContacts() async throws -> [ContactDTO] {
        let keysToFetch: [CNKeyDescriptor] = [
            CNContactIdentifierKey as CNKeyDescriptor,
            CNContactGivenNameKey as CNKeyDescriptor,
            CNContactFamilyNameKey as CNKeyDescriptor,
            CNContactEmailAddressesKey as CNKeyDescriptor,
            CNContactPhoneNumbersKey as CNKeyDescriptor,
            CNContactOrganizationNameKey as CNKeyDescriptor,
            CNContactJobTitleKey as CNKeyDescriptor,
            CNContactNoteKey as CNKeyDescriptor,
        ]
        
        let request = CNContactFetchRequest(keysToFetch: keysToFetch)
        var contacts: [ContactDTO] = []
        
        try contactStore.enumerateContacts(with: request) { contact, _ in
            contacts.append(ContactDTO(
                appleContactId: contact.identifier,
                firstName: contact.givenName.isEmpty ? nil : contact.givenName,
                lastName: contact.familyName.isEmpty ? nil : contact.familyName,
                email: contact.emailAddresses.first?.value as String?,
                phone: contact.phoneNumbers.first?.value.stringValue,
                company: contact.organizationName.isEmpty ? nil : contact.organizationName,
                jobTitle: contact.jobTitle.isEmpty ? nil : contact.jobTitle,
                notes: contact.note.isEmpty ? nil : contact.note,
                modifiedAt: ISO8601DateFormatter().string(from: Date())
            ))
        }
        
        return contacts
    }
    
    private func sendSyncRequest(_ dto: SyncContactsDTO) async throws -> SyncResult {
        guard let authToken = authToken else {
            throw ContactsError.noAuthToken
        }
        
        let url = URL(string: "\(apiBaseURL)/api/apple-contacts/sync")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        request.httpBody = try encoder.encode(dto)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw ContactsError.syncFailed
        }
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(SyncResult.self, from: data)
    }
}

// MARK: - DTOs

struct ContactDTO: Codable {
    let appleContactId: String
    let firstName: String?
    let lastName: String?
    let email: String?
    let phone: String?
    let company: String?
    let jobTitle: String?
    let notes: String?
    let modifiedAt: String
}

struct SyncContactsDTO: Codable {
    let contacts: [ContactDTO]
    let syncToken: String?
    let isFullSync: Bool
}

struct SyncResult: Codable {
    let created: Int
    let updated: Int
    let conflicts: Int
    let errors: Int
}

enum ContactsError: LocalizedError {
    case accessDenied
    case noAuthToken
    case syncFailed
    
    var errorDescription: String? {
        switch self {
        case .accessDenied:
            return "Access to contacts denied"
        case .noAuthToken:
            return "No authentication token"
        case .syncFailed:
            return "Sync failed"
        }
    }
}
```

### Шаг 4: Создать UI

**Файл**: `AppleContactsView.swift`

```swift
import SwiftUI

struct AppleContactsView: View {
    @StateObject private var contactsManager = ContactsManager()
    @State private var showingError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                headerView
                statusCard
                syncButton
                statsView
                
                Spacer()
            }
            .padding()
            .navigationTitle("Apple Contacts")
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private var headerView: some View {
        VStack(spacing: 10) {
            Image(systemName: "person.2.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.blue)
            
            Text("Sync Your Contacts")
                .font(.title2)
                .fontWeight(.bold)
        }
    }
    
    @ViewBuilder
    private var statusCard: some View {
        HStack {
            statusIcon
            
            VStack(alignment: .leading, spacing: 5) {
                Text(statusText)
                    .font(.headline)
                
                if let lastSync = contactsManager.lastSyncDate {
                    Text("Last synced: \(lastSync, style: .relative) ago")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
    
    @ViewBuilder
    private var statusIcon: some View {
        switch contactsManager.syncStatus {
        case .notConnected:
            Image(systemName: "xmark.circle")
                .foregroundColor(.gray)
                .font(.largeTitle)
        case .syncing:
            ProgressView()
        case .synced:
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
                .font(.largeTitle)
        case .error:
            Image(systemName: "exclamationmark.triangle")
                .foregroundColor(.red)
                .font(.largeTitle)
        }
    }
    
    private var statusText: String {
        switch contactsManager.syncStatus {
        case .notConnected:
            return "Not connected"
        case .syncing:
            return "Syncing..."
        case .synced:
            return "Synced successfully"
        case .error(let message):
            return message
        }
    }
    
    private var syncButton: some View {
        Button(action: syncContacts) {
            HStack {
                Image(systemName: "arrow.triangle.2.circlepath")
                Text("Sync Contacts")
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(
                contactsManager.syncStatus == .syncing
                    ? Color.gray
                    : Color.blue
            )
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .disabled(contactsManager.syncStatus == .syncing)
    }
    
    private var statsView: some View {
        HStack(spacing: 20) {
            StatCard(
                title: "Total Synced",
                value: "\(contactsManager.totalSynced)",
                icon: "person.2.fill"
            )
            
            StatCard(
                title: "Status",
                value: contactsManager.syncStatus == .synced ? "Active" : "Inactive",
                icon: "antenna.radiowaves.left.and.right"
            )
        }
    }
    
    private func syncContacts() {
        Task {
            do {
                try await contactsManager.requestAccess()
                
                // TODO: Get real auth token from AuthManager
                let token = "test_jwt_token"
                
                try await contactsManager.syncContacts(authToken: token)
            } catch {
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}
```

---

## 🧪 Тестирование

### На Симуляторе

```bash
# В Xcode:
Product → Run
# Выбрать iPhone 15 Pro (симулятор)
```

**⚠️ Ограничение**: Симулятор не имеет реальных контактов. Нужно добавить вручную:
- Contacts app → Add Contact

### На Реальном Устройстве

```bash
# В Xcode:
Product → Destination → Your iPhone
Product → Run
```

**Checklist**:
1. ✅ Запросить разрешения
2. ✅ Нажать "Sync Contacts"
3. ✅ Проверить статус синхронизации
4. ✅ Проверить в backend (Supabase Dashboard)

---

## 📊 Backend API Endpoints

### 1. Sync Contacts

```http
POST https://api.97k.ru/api/apple-contacts/sync
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "contacts": [...],
  "syncToken": null,
  "isFullSync": true
}
```

### 2. Get Status

```http
GET https://api.97k.ru/api/apple-contacts/status
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. Get Conflicts

```http
GET https://api.97k.ru/api/apple-contacts/conflicts
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. Resolve Conflict

```http
POST https://api.97k.ru/api/apple-contacts/conflicts/:id/resolve
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "strategy": "local_wins"
}
```

### 5. Disconnect

```http
DELETE https://api.97k.ru/api/apple-contacts/disconnect
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## ✅ Checklist

**Backend**:
- [x] AppleContactsModule создан
- [x] 5 API endpoints работают
- [x] Prisma schema обновлена
- [x] Unit tests проходят (9/9)
- [x] GitHub commit (23f33d0)

**iOS** (TODO):
- [ ] Xcode проект создан
- [ ] ContactsManager.swift реализован
- [ ] AppleContactsView.swift создан
- [ ] Permissions добавлены
- [ ] Тестирование на устройстве
- [ ] TestFlight beta

---

## 📖 Документация

- **Полная архитектура**: [PHASE_10_APPLE_CONTACTS_INTEGRATION.md](./PHASE_10_APPLE_CONTACTS_INTEGRATION.md)
- **Быстрый старт**: [PHASE_10_QUICK_START_RU.md](./PHASE_10_QUICK_START_RU.md)
- **Финальное резюме**: [PHASE_10_FINAL_SUMMARY_RU.md](./PHASE_10_FINAL_SUMMARY_RU.md)

---

**Status**: 📋 READY TO IMPLEMENT  
**Estimated Time**: 1 day  
**Next Step**: Create Xcode project 🚀
