"""Run: python seed.py   (drops and recreates all tables -> deterministic demo data)"""
import hashlib
import random
from datetime import date, timedelta

from database import Base, SessionLocal, engine
from models import Booking, Listing, Review, User

U = "https://images.unsplash.com/photo-{}?auto=format&fit=crop&w=1200&q=80"
PHOTO_IDS = [
    "1564013799919-ab600027ffc6", "1568605114967-8130f3a36994", "1512917774080-9991f1c4c750",
    "1600596542815-ffad4c1539a9", "1600585154340-be6161a56a0c", "1502672260266-1c1ef2d93688",
    "1522708323590-d24dbb6b0267", "1560448204-e02f11c3d0e2", "1493809842364-78817add7ffb",
    "1505691938895-1758d7feb511", "1484154218962-a197022b5858", "1556909114-f6e7ad7d3136",
    "1600607687939-ce8a6c25118c", "1600566753190-17f0baa2a6c3", "1598928506311-c55ded91a20c",
    "1583608205776-bfd35f0d9f83",
]
AMEN = ["Wifi", "Kitchen", "Free parking", "Air conditioning", "TV", "Washing machine",
        "Pool", "Gym", "Power backup", "Balcony", "Hot water", "Workspace", "Garden", "BBQ grill"]

def pw(p: str) -> str:  # demo-only hashing
    return hashlib.sha256(("airbnb-demo" + p).encode()).hexdigest()

# title, city, address, price, cleaning, guests, bedrooms, beds, baths, host_idx
LISTINGS = [
    ("Modern 3BHK villa near Rock Garden", "Chandigarh", "Sector 9, Chandigarh", 9379, 800, 6, 3, 4, 3, 0),
    ("Heritage home in Sector 17", "Chandigarh", "Sector 17, Chandigarh", 7450, 600, 4, 2, 3, 2, 0),
    ("Designer studio by Sukhna Lake", "Chandigarh", "Sector 1, Chandigarh", 4200, 400, 2, 1, 1, 1, 1),
    ("Le Corbusier-inspired architect's loft", "Chandigarh", "Sector 22, Chandigarh", 6800, 500, 3, 1, 2, 1, 1),
    ("Spacious family flat, Sector 35", "Chandigarh", "Sector 35, Chandigarh", 3800, 300, 5, 2, 3, 2, 2),
    ("Poolside villa in Zirakpur", "Zirakpur", "VIP Road, Zirakpur", 11200, 1000, 8, 4, 5, 4, 2),
    ("Cozy apartment in Mohali Phase 7", "Mohali", "Phase 7, Mohali", 4100, 350, 3, 1, 2, 1, 0),
    ("Garden bungalow, Sector 70 Mohali", "Mohali", "Sector 70, Mohali", 8900, 700, 6, 3, 4, 3, 1),
    ("Skyline penthouse near IT City", "Mohali", "Sector 82, Mohali", 12400, 900, 4, 2, 2, 2, 2),
    ("Minimal home with workspace, Sector 66", "Mohali", "Sector 66, Mohali", 5300, 400, 4, 2, 2, 2, 0),
    ("Luxe 2BHK in DLF Phase 3", "Gurgaon", "DLF Phase 3, Gurgaon", 8200, 650, 4, 2, 3, 2, 1),
    ("Golf-course view suite, Golf Course Road", "Gurgaon", "Golf Course Rd, Gurgaon", 14500, 1200, 4, 2, 2, 2, 2),
    ("Cyber Hub studio, walk to cafes", "Gurgaon", "Cyber City, Gurgaon", 5600, 450, 2, 1, 1, 1, 0),
]
COMMENTS = [
    "Spotless and exactly as pictured. Check-in was effortless.",
    "The host was incredibly responsive. We would stay again.",
    "Beautiful light, comfortable beds, and a great neighbourhood.",
    "Perfect for our family weekend. Kitchen was well stocked.",
    "Quiet, stylish and very well located.",
    "Felt like a home away from home. Highly recommended.",
    "Great value and thoughtful touches everywhere.",
    "Loved the interiors. Sleeping was a dream.",
]
NAMES = ["Aarav", "Meera", "Rohan", "Simran", "Kabir", "Ananya", "Harpreet", "Isha", "Vikram", "Tanya"]

# listing_index, guest_idx(0..2), start offset (days from today), nights
BOOKINGS = [
    (0, 0, 10, 3), (0, 1, 13, 2),  # back-to-back: 10-13 then 13-15
    (0, 2, 30, 4), (1, 0, 7, 2), (2, 1, 5, 3), (3, 2, 14, 5), (5, 0, 20, 3),
    (5, 1, 24, 2), (6, 2, 9, 4), (7, 0, 16, 3), (8, 1, 12, 2), (10, 2, 8, 3),
    (11, 0, 18, 4), (12, 1, 6, 2),
    (0, 0, -25, 3), (2, 2, -40, 2), (6, 1, -12, 3),  # past stays (Trips > Past)
]

def main():
    rng = random.Random(42)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()

    hosts = [User(name=n, email=f"{n.lower()}@host.demo", password_hash=pw("demo"), is_host=True)
             for n in ["Gurpreet", "Neha", "Rajiv"]]
    guests = [User(name=n, email=f"{n.lower()}@guest.demo", password_hash=pw("demo"), is_host=False)
              for n in ["Pulkit", "Aditi", "Sameer"]]
    db.add_all(hosts + guests)
    db.flush()

    objs = []
    for i, (t, city, addr, price, clean, mg, br, bd, ba, h) in enumerate(LISTINGS):
        imgs = [U.format(PHOTO_IDS[(i * 3 + k) % len(PHOTO_IDS)]) for k in range(5)]
        l = Listing(
            host_id=hosts[h].id, title=t, category="Homes", city=city, address=addr,
            description=f"{t}. A bright, thoughtfully designed stay in {city} with everything you need "
                        f"for a comfortable trip: fast Wi-Fi, a full kitchen and a dedicated host who knows the area.",
            price_per_night=price, cleaning_fee=clean, image_urls=imgs, max_guests=mg,
            bedrooms=br, beds=bd, bathrooms=ba, amenities=rng.sample(AMEN, 9), status="published",
        )
        db.add(l)
        db.flush()
        ratings = [5] * 8
        if i % 3 == 0:
            ratings[0] = 4  # avg 4.875
        for r in ratings:
            db.add(Review(listing_id=l.id, reviewer_name=rng.choice(NAMES), rating=r, comment=rng.choice(COMMENTS)))
        objs.append(l)

    today = date.today()
    for li, gi, off, nights in BOOKINGS:
        l = objs[li]
        total = round(nights * l.price_per_night + l.cleaning_fee + 0.14 * nights * l.price_per_night)
        db.add(Booking(listing_id=l.id, guest_id=guests[gi].id, check_in=today + timedelta(days=off),
                       check_out=today + timedelta(days=off + nights), guests=min(2, l.max_guests),
                       total_price=total, status="confirmed"))
    db.commit()
    print(f"Seeded {len(hosts)+len(guests)} users, {len(objs)} listings, {len(BOOKINGS)} bookings.")

if __name__ == "__main__":
    main()