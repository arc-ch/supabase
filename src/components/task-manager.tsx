import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "../supabase-client";
import { Session } from "@supabase/supabase-js";

interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  image_url: string;
}

function TaskManager({ session }: { session: Session }) {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newDescription, setNewDescription] = useState("");

  const [taskImage, setTaskImage] = useState<File | null>(null);

  const fetchTasks = async () => {
    const { error, data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error reading task: ", error.message);
      return;
    }

    setTasks(data);
  };

  const deleteTask = async (id: number) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting task: ", error.message);
      return;
    }
  };

  const updateTask = async (id: number) => {
    const { error } = await supabase
      .from("tasks")
      .update({ description: newDescription })
      .eq("id", id);

    if (error) {
      console.error("Error updating task: ", error.message);
      return;
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    // Adding date to filename to get unique name
    const filePath = `${file.name}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("tasks-images") 
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading image:", error.message);
      return null;
    }

    const { data } = await supabase.storage
      .from("tasks-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    let imageUrl: string | null = null;
    if (taskImage) {
      imageUrl = await uploadImage(taskImage);
    }

    const { error } = await supabase
      .from("tasks")
      .insert({ ...newTask, email: session.user.email, image_url: imageUrl })
      .select()
      .single();

    if (error) {
      console.error("Error adding task: ", error.message);
      return;
    }

    setNewTask({ title: "", description: "" });
  };


  // 🔁 Summary of the Image Flow =>
  // 1️⃣	handleFileChange	Captures selected file into state (taskImage)
  // 2️⃣	handleSubmit	Triggers on form submit
  // 3️⃣	uploadImage(file)	Renames file + uploads to Supabase
  // 4️⃣	getPublicUrl()	Gets public link to uploaded image
  // 5️⃣	Save to DB	image_url stored with task in Supabase
  // 6️⃣	Display in UI	Task appears with image URL rendered <img>


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskImage(e.target.files[0]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
  // Create a Supabase channel for listening to changes in the "tasks" table
  const channel = supabase.channel("tasks-channel");

  // Listen for INSERT events and add the new task to the state
  channel.on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "tasks" }, // WHEN CHANGE HAPPENS IN THIS EVENT
      (payload) => {                                         // PAYLOAD IS THE FUNCTION THAT IS CALLED WHEN THAT CHANGE HAPPENS DUE TO ABOVEMENTIONED EVENT
      const newTask = payload.new as Task;
      setTasks((prev) => [...prev, newTask]); // Add the new task to the list
    }
  );

  // Listen for DELETE events and remove the deleted task from the state
  channel.on(
    "postgres_changes",
    { event: "DELETE", schema: "public", table: "tasks" },
    (payload) => {
      const deletedTaskId = payload.old.id;
      setTasks((prev) => prev.filter((task) => task.id !== deletedTaskId)); // Remove task by ID
    }
  );

  // Listen for UPDATE events and update the changed task in the state
  channel.on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "tasks" },
    (payload) => {
      const updatedTask = payload.new as Task;
      setTasks((prev) =>
        prev.map((task) =>
          task.id === updatedTask.id ? updatedTask : task // Replace updated task
        )
      );
    }
  );

  // Subscribe to the channel and log status
  channel.subscribe((status) => { // channel.subscribe() activates the listener.
    console.log("Subscription:", status); // Optional: log subscription status
  });

  // Cleanup: unsubscribe when the component unmounts
  return () => {
    channel.unsubscribe();
  };
}, []);


  console.log(tasks);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      <h2>Task Manager CRUD</h2>

      {/* Form to add a new task */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Task Title"
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, title: e.target.value }))
          }
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />
        <textarea
          placeholder="Task Description"
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, description: e.target.value }))
          }
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />

        <input type="file" accept="image/*" onChange={handleFileChange} />

        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Add Task
        </button>
      </form>

      {/* List of Tasks */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((task, key) => (
          <li
            key={key}
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            <div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <img src={task.image_url} style={{ height: 70 }} />
              <div>
                <textarea
                  placeholder="Updated description..."
                  onChange={(e) => setNewDescription(e.target.value)}
                />
                <button
                  style={{ padding: "0.5rem 1rem", marginRight: "0.5rem" }}
                  onClick={() => updateTask(task.id)}
                >
                  Edit
                </button>
                <button
                  style={{ padding: "0.5rem 1rem" }}
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );


}


export default TaskManager;
